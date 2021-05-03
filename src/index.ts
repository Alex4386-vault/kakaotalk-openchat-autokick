import fs from 'fs';
import { Long, OpenChannel, OpenChannelUserInfo, TalkClient, TalkOpenChannel } from 'node-kakao';
import { OpenChannelEvent } from 'node-kakao/dist/talk/event';
import { ConfigInterface } from './interface';
import { login } from './login';
import chalk from 'chalk';
import figlet from 'figlet';

export const config = JSON.parse(fs.readFileSync('config.json', { encoding: 'utf-8' })) as ConfigInterface;
const autoKickChannels: Long[] = [Long.fromString('18202893633846505')];

function isTargetChannel(channelId: Long) {
  return autoKickChannels.filter((n) => n.eq(channelId)).length > 0;
}

let kickTargets: {
  channelId: Long;
  userId: Long;
  timeout: NodeJS.Timeout;
}[] = [];

console.log(figlet.textSync('Autokick', 'Small Slant'));
console.log(chalk.yellowBright(chalk.bold('Kakaotalk')), 'Openchat', chalk.redBright(chalk.underline('Autokick')));
console.log();

(async () => {
  const loginData = await login();
  const client = new TalkClient();
  const clientLoginRes = await client.login({
    deviceUUID: config.deviceUuid,
    accessToken: loginData.result.accessToken,
    refreshToken: loginData.result.refreshToken,
  });

  if (!clientLoginRes.success) throw new Error('Client login failed with status: ' + clientLoginRes.status);

  console.log();

  client.on('chat', (data, channel) => {
    const sender = data.getSenderInfo(channel);
    if (!sender) return;

    console.log(
      '[' + new Date().toLocaleString() + ']',
      chalk.greenBright('[NEW MESG]'),
      chalk.yellowBright('[' + channel.getDisplayName() + ']'),
      chalk.cyanBright(sender.userId, '(' + sender.nickname + ')'),
      ':',
      data.chat.text,
    );

    if (isTargetChannel(channel.channelId)) {
      const targets = kickTargets.filter((n) => n.channelId.eq(channel.channelId) && sender.userId.eq(n.userId));

      if (targets.length > 0) {
        for (const target of targets) {
          clearTimeout(target.timeout);
        }

        kickTargets = kickTargets.filter((n) => !(n.channelId.eq(channel.channelId) && sender.userId.eq(n.userId)));
        console.log(chalk.redBright('Removed target: ' + sender.nickname));
      }
    }
  });

  // Main process start
  client.on('user_join', (joinLog, channel, user, feed) => {
    console.log(
      '[' + new Date().toLocaleString() + ']',
      chalk.greenBright('[NEW USER]'),
      chalk.yellowBright('[' + channel.getDisplayName() + ']'),
      chalk.cyanBright(user.userId, '(' + user.nickname + ')'),
    );

    if (isTargetChannel(channel.channelId)) {
      console.log(chalk.greenBright('[TARG ADD]'), chalk.cyanBright(user.userId, '(' + user.nickname + ')'));

      const randomMinutes = Math.random() * 10 + 10;

      kickTargets.push({
        channelId: channel.channelId,
        userId: user.userId,
        timeout: setTimeout(() => {
          console.log(
            '[' + new Date().toLocaleString() + ']',
            chalk.redBright('[KICKUSER]'),
            chalk.yellowBright('[' + channel.getDisplayName() + ']'),
            chalk.cyanBright(user.userId, '(' + user.nickname + ')'),
          );
          (client.channelList.get(channel.channelId) as TalkOpenChannel).kickUser(user);
        }, 1000 * randomMinutes * 60),
      });
    }
  });
})();
