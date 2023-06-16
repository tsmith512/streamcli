const { readFileSync, writeFile } = require("fs");

const message = `
Good afternoon friends,

Thank you so much for hopping into our Stream Live test group! Next week, for Speed Week, we'll be announcing our beta support for Low-Latency HTTP Streaming (LL-HLS), an extension of HLS (which we already support).

Adding LL-HLS will reduce what we call "glass-to-glass" latency --- that is "how long it takes from when something happens on the broadcast end until a viewer sees it on their screen." HLS has historically prioritized compatibility, features, and reliability. LL-HLS responds to market pressure to reduce latency and bring the viewer experience closer to realtime. The Live team has been working most of this year on adding LL-HLS to our platform and player, and we're excited to onboard new testers.

For this test, I have provisioned a Live Input source for each of you in my own account, which will have LL-HLS enabled.

Instructions below, but here are the keys and settings you'll need:

Live input name:  {{title}} (ID: {{id}})
Your RTMPS Key: {{rtmpsKey}}
RTMPS URL: {{rtmpsUrl}}
Video codec: H.264
Keyframe interval / GOP Size: 2 seconds
B Frames: 0

And when you go live, you can watch your own stream on the same device or something else here:

{{llhlswatch}}

This is the regular Stream iframe player!

Here's a video walking through the concept and setting up OBS on my end: https://customer-igynxd2rwhmuoxw8.cloudflarestream.com/e9afdcdac019440ff28b3aa0ef3fc000/watch

OBS is a broadcast application that helps streamers put together and transmit their video --- in this case, to us! That's what we'll focus on as our input for testing, but if you use something else, I'd like to hear about your experience! https://obsproject.com/

We'd love to hear about your experiences and observations. Run into trouble? Hit me up or ask in our "Stream Low Latency Testers" group https://chat.google.com/room/AAAAglFmzik?cls=7

Many thanks,
TSmith
`;

const [headers, ...body] = readFileSync('output/mailmergegroup.csv').toString().trim().split('\r\n');
const columns = headers.split(',');

body.forEach(row => {
  const data = row.split(',');
  const map = Object.fromEntries(columns.map((v, i) => [v, data[i]]));

  console.log(`\n\nSEND TO ${map.label}\nSUBJECT: Stream Live LL-HLS Internal Testing Intro\n---------------------\n`);
  console.log(message.replaceAll(/\{\{\w+\}\}/g, (match) => {
    const key = match.slice(2, -2);
    return map[key];
  }));
});
