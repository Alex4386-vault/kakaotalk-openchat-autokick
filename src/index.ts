import fs from 'fs';
import { Long, OpenChannel, OpenChannelUserInfo, TalkClient, TalkOpenChannel } from 'node-kakao';
import { OpenChannelEvent } from 'node-kakao/dist/talk/event';
import { ConfigInterface } from './interface';
import { login } from './login';
import chalk from 'chalk';

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

console.log(chalk.yellowBright('Kakaotalk'), 'Openchat', chalk.redBright('Autokick'));
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
      chalk.greenBright('[NEW MSG ]'),
      data.chat.text,
      '\n',
      'Channel:',
      chalk.yellowBright(channel.channelId, '(' + channel.getDisplayName() + ')'),
      '/ User:',
      chalk.cyanBright(sender.userId, '(' + sender.nickname + ')'),
    );

    if (isTargetChannel(channel.channelId)) {
      const targets = kickTargets.filter((n) => n.channelId.eq(channel.channelId) && sender.userId.eq(n.userId));

      if (targets.length > 0) {
        for (const target of targets) {
          clearTimeout(target.timeout);
        }

        kickTargets = kickTargets.filter((n) => !(n.channelId.eq(channel.channelId) && sender.userId.eq(n.userId)));
        console.log(chalk.redBright('Removed target: ' + sender.nickname));

        setTimeout(() => {
          channel.sendChat(sender.nickname + '님! 인증 감사합니다!');
        }, 2000);
      }
    }
  });

  // Main process start
  client.on('user_join', (joinLog, channel, user, feed) => {
    console.log(
      '[' + new Date().toLocaleString() + ']',
      chalk.greenBright('[NEW USER]'),
      'Channel:',
      chalk.yellowBright(channel.channelId, '(' + channel.getDisplayName() + ')'),
      '/ User:',
      chalk.cyanBright(user.userId, '(' + user.nickname + ')'),
    );

    if (isTargetChannel(channel.channelId)) {
      setTimeout(() => {
        console.log(
          '[' + new Date().toLocaleString() + ']',
          chalk.redBright('[SEND MSG]'),
          'to',
          chalk.cyanBright(
            user.userId,
            '(' + user.nickname + ')',
            '/ Channel:',
            chalk.yellowBright(channel.channelId, '(' + channel.getDisplayName() + ')'),
          ),
        );

        channel.sendChat(
          '안녕하세요, ' + user.nickname + '님! 메세지 남겨 주시면 감사하겠습니다. (스팸 차단 목적입니다!)',
        );
      }, 2000);

      console.log(chalk.greenBright('Added target: '), chalk.cyanBright(user.userId, '(' + user.nickname + ')'));

      kickTargets.push({
        channelId: channel.channelId,
        userId: user.userId,
        timeout: setTimeout(() => {
          console.log(
            '[' + new Date().toLocaleString() + ']',
            chalk.redBright('[KICKUSER]'),
            chalk.cyanBright(
              user.userId,
              '(' + user.nickname + ')',
              '@ Channel:',
              chalk.yellowBright(channel.channelId, '(' + channel.getDisplayName() + ')'),
            ),
          );
          (client.channelList.get(channel.channelId) as TalkOpenChannel).kickUser(user);
        }, 1000 * 60 * 60),
      });
    }
  });
})();
