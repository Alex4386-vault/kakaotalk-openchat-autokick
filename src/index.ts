import fs from 'fs';
import { Long, OpenChannel, OpenChannelUserInfo, TalkClient, TalkOpenChannel } from 'node-kakao';
import { OpenChannelEvent } from 'node-kakao/dist/talk/event';
import { ConfigInterface } from './interface';
import { login } from './login';
import chalk from 'chalk';

export const config = JSON.parse(fs.readFileSync('config.json', { encoding: 'utf-8' })) as ConfigInterface;
const autoKickChannels: Long[] = [new Long(18202893633846505)];

function isTargetChannel(channelId: Long) {
  return autoKickChannels.filter((n) => n.eq(channelId)).length > 0;
}

let kickTargets: {
  channelId: Long;
  userId: Long;
  timeout: NodeJS.Timeout;
}[] = [];

(async () => {
  const loginData = await login();
  const client = new TalkClient();
  const clientLoginRes = await client.login({
    deviceUUID: config.deviceUuid,
    accessToken: loginData.result.accessToken,
    refreshToken: loginData.result.refreshToken,
  });

  if (!clientLoginRes.success) throw new Error('Client login failed with status: ' + clientLoginRes.status);

  client.on('chat', (data, channel) => {
    const sender = data.getSenderInfo(channel);
    if (!sender) return;

    if (isTargetChannel(channel.channelId)) {
      const targets = kickTargets.filter((n) => n.channelId.eq(channel.channelId) && sender.userId.eq(n.userId));

      if (targets.length > 0) {
        for (const target of targets) {
          clearTimeout(target.timeout);
        }
      }

      kickTargets = kickTargets.filter((n) => !(n.channelId.eq(channel.channelId) && sender.userId.eq(n.userId)));
      console.log(chalk.redBright('Removed target: ' + sender.nickname));

      setTimeout(() => {
        channel.sendChat(sender.nickname + '님! 인증 감사합니다!');
      }, 2000);
    }
  });

  // Main process start
  client.on('user_join', (joinLog, channel, user, feed) => {
    setTimeout(() => {
      if (isTargetChannel(channel.channelId)) {
        channel.sendChat(
          '안녕하세요, ' + user.nickname + '님! 메세지 남겨 주시면 감사하겠습니다. (스팸 차단 목적입니다!)',
        );
      }
    }, 2000);

    console.log(chalk.greenBright('Added target: ' + user.nickname));
    kickTargets.push({
      channelId: channel.channelId,
      userId: user.userId,
      timeout: setTimeout(() => {
        (client.channelList.get(channel.channelId) as TalkOpenChannel).kickUser(user);
      }, 1000 * 60 * 60),
    });
  });
})();
