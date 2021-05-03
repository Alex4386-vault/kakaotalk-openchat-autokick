# Kakaotalk OpenChat Autokick
Utilizing LOCO Implementation on Node.JS, defend your openchat servers from automated bot attacks.

Has this ever happened to you?  
```
A: Did you guys have a good lunch?
B: BITCOIN, HOW TO INVEST! GET THE STRATEGY BOOK AT www.bitcoin-invest.crypto RIGHT~ NOW!
C: (Exploits utilizing Lack of server-side validation of loco protocol)
D: DOWNLOAD THIS APP RIGHT~ NOW~
E: WT-heck are these ads, srsly?
A: GOD DAMN IT.
```

Yes, I've experienced that and reporting to kakao did somehow help. But It still sucks.

So, Introducing Kakaotalk openchat autokick! Usually those ad guys stay silent. And even with the message: "Please type any message to verify you are human", they did not respond. Probably they are utilizing automated bots using LOCO protocol.  

There is an old saying, "Eye for an eye". This software utilizes LOCO Protocol to automatically kick people who are not responding for 10+@ minutes with proper message request.  


## GitHub Actions Status
**Warning :** Make sure you change this badge locations and names before you use it on your repository!  

| Name                      | Status                                                                                                         |
|---------------------------|----------------------------------------------------------------------------------------------------------------|
| ESLint                    | ![ESLint](https://github.com/Alex4386/kakaotalk-openchat-autokick/workflows/ESLint/badge.svg)                         |

## I want to use this configuration with React! 
Go to [.eslintrc.js](.eslintrc.js) file and uncomment.  

## I want to update the dependencies!
run `yarn upgrade`

## License
[WTFPL](LICENSE)
