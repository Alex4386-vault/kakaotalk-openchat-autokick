import { config } from './';
import * as NodeKakao from 'node-kakao';
import fs from 'fs';

import chalk from 'chalk';
import { prompt, prompts } from 'prompts';

export async function login() {
  if (!config.deviceUuid) {
    config.deviceUuid = NodeKakao.util.randomWin32DeviceUUID();
    fs.writeFileSync('config.json', JSON.stringify(config));
  }

  const loginCredentials = {
    email: config.email,
    password: config.password,
  };

  const api = await NodeKakao.AuthApiClient.create(config.deviceName, config.deviceUuid);
  let login = await api.login({
    ...loginCredentials,
    forced: true,
  });

  if (!login.success) {
    if (login.status !== NodeKakao.KnownAuthStatusCode.DEVICE_NOT_REGISTERED) {
      throw new Error(`Login failed with status code: ${login.status}`);
    }

    const passcodeRequest = await api.requestPasscode(loginCredentials);
    if (!passcodeRequest.success) throw new Error(`Failed to request passcode: ${login.status}`);

    console.log(chalk.redBright(chalk.bold('This device seems not to be registered!')));
    const result = await prompt({
      type: 'text',
      name: 'passcode',
      message: 'Enter the passcode you received from your phone',
      validate: (value: string) => (value.length === 4 ? true : 'Invalid Passcode'),
    });

    const passcode = result.passcode;

    const registerRes = await api.registerDevice(loginCredentials, passcode, true);
    if (!registerRes.success) throw new Error(`Registration failed with status: ${registerRes.status}`);

    console.log(chalk.greenBright(chalk.bold('Registration Success!')));
    login = await api.login({
      ...loginCredentials,
      forced: true,
    });

    if (!login.success) {
      throw new Error(`Login failed with status code: ${login.status}`);
    }
  }

  console.log(chalk.greenBright(chalk.bold('Login Success!')));
  console.log(chalk.cyanBright(chalk.bold('User ID:') + ' ' + login.result.userId));
  console.log(chalk.cyanBright(chalk.bold('Access Token:') + ' ' + login.result.accessToken));
  console.log(chalk.cyanBright(chalk.bold('Refresh Token:') + ' ' + login.result.refreshToken));
  return login;
}
