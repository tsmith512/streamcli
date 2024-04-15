import chalk from "chalk";
import { debug } from "./debug";
import yesno from "yesno";
import crypto, { sign } from 'crypto';
import prompts from 'prompts';


/**
 * Get a list of all videos in the account.
 *
 * @returns (any[]) array of VOD Videos (will include saved Lives)
 */
export const getVodVideos = async (field?: string, match?: string): Promise<any[]> => {
  if (field && !match) {
    console.log(chalk.red(`Must provide a value to match in field ${field}.`));
    return [];
  }

  let url = `${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream`;

  // If we got a Live Input ID it means we are looking for LTV recordings off
  // that ID specifically.
  if (field === 'live') {
    url += `/live_inputs/${match}/videos`;
  }

  // If we got a Creator ID, filter the list
  if (field === 'creator') {
    url += `?creator=${match}`;
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const videos: any[] = [];
  let count = -1;
  const limit = 50;

  // @TODO: This endpoint doesn't paginate? Or maybe I don't have enough
  while (count === -1 || videos.length < count) {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
        // @TODO: Do some paging here if needed
      },
    });

    const theseVideos = await response.json() as any;

    // On first run, we need to set the count correctly.
    count = theseVideos.result.length;
    videos.push(...theseVideos.result);
  }

  debug('info', `Fetched ${videos.length} videos.`)
  const report = await Promise.all(videos);
  return report;
};

export const getVodVideo = async (id: string): Promise<any | false > => {
  const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/${id}`, {
    headers: {
      'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
    },
  });

  if (!response.ok) {
    debug('info', `HTTP ${response.status}: ${response.statusText}`);
  }

  const payload = await response.json();

  if (payload.success && payload.result?.uid) {
    return {
      name: payload.result?.meta?.name || null,
      state: payload.result?.status?.state || null,
      created: payload.result?.created || null,
      scheduledDeletion: payload.result?.scheduledDeletion,
      requireSignedURLs: payload.result?.requireSignedURLs,
      allowedOrigins: JSON.stringify(payload.result?.allowedOrigins) || null,
      preview: payload.result?.preview || null,
    };
  } else {
    return false;
  }
};


export const deleteVodVideo = async (id: string, confirmed = false): Promise<boolean> => {
  const ok = confirmed || await yesno({
    question: `${chalk.red('Really delete')} video? Cannot undo. (y/n)`,
    defaultValue: null,
  });

  if (!ok) {
    return false;
  }

  const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
    },
  });

  if (response.ok) {
    console.log(chalk.yellow(`Deleted ${id}`));
    return true;
  } else {
    console.log(chalk.red(`Failed to delete ${id}`));
    return false;
  }
};

export const setVodSignedURL = async (id: string): Promise<boolean> => {
  const req = await yesno({
    question: `${chalk.red('Require signed URL')} to watch the video? (y/n)`,
    defaultValue: null,
  });

  const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/${id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
    },
    body: JSON.stringify({
      requireSignedURLs: req,
    })
  });

  if (response.ok) {
    console.log(chalk.yellow(`Updated ${id}`));
    return true;
  } else {
    console.log(chalk.red(`Failed to update ${id}`));
    return false;
  }
};

/**
 * Set the Creator ID on a VOD video.
 *
 * @param videoId (string) VOD video id
 * @param creator (string) creator label
 * @returns Promise<boolean> of success
 */
export const setVodCreator = async(videoId: string, creator: string): Promise<boolean> => {
  const url = `${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/${videoId}`;

  const content = JSON.stringify({'creator': creator});

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
    },
    method: 'POST',
    body: content,
  });

  if (!response.ok) {
    console.log(await response.json())
    return false;
  } else {
    return true;
  }
}


export const makeVodClip = async (id: string): Promise<string | false> => {
  const start = await prompts({
    type: 'text',
    name: 'time',
    message: 'Start time (seconds from start)?',
  });

  const end = await prompts({
    type: 'text',
    name: 'time',
    message: 'End time (seconds from start)?',
  });

  const info = await getVodVideo(id);

  const payload = {
    clippedFromVideoUID: id,
    startTimeSeconds: parseInt(start.time),
    endTimeSeconds: parseInt(end.time),
    meta: {
      name: `Clip from ${info.name || id}`,
    }
  };


  const response = await fetch(`${process.env.CF_API}/${process.env.CF_ACCT_TAG}/stream/clip`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CF_STREAM_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if  (!response.ok) {
    return false;
  }

  const result = response.json().then(payload => {
    // @TODO: Uhhhh betterify this.
    if (payload.result?.uid) {
      return payload.result.uid;
    } else {
      return false;
    }
  });

  return result;
};

export const getVodSignedURL = async (id: string): Promise<string | false> => {
  // One year from right now, as a unix timestamp
  const expiry = (new Date().getTime() / 1000) + (365 * 24 * 60 * 60);

  const encoder = new TextEncoder();

  const headers = {
    "alg": "RS256",
    "kid": process.env.SIGNED_URL_ID
  };

  const data = {
    "sub": id,
    // "kid": keyID,
    "exp": expiry,
    "accessRules": [
      {
        "type": "any",
        "action": "allow"
      }
    ]
  };

  const payloadHeaders =
    Buffer.from(JSON.stringify(headers), 'utf-8').toString('base64url')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const payloadData =

    Buffer.from(JSON.stringify(data), 'utf-8').toString('base64url')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const token = `${payloadHeaders}.${payloadData}`;
console.log(token);
  const jwk = JSON.parse(atob(process.env.SIGNED_URL_JWK as string));

  const key = await crypto.subtle.importKey(
    "jwk", jwk,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false, [ "sign" ],
  );

  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'},
    key,
    encoder.encode(token)
  );
console.log(signature);
  const signatureData =
  btoa(uint8ToUrlBase64(new Uint8Array(signature)))
  // Buffer.from(JSON.stringify(signature), 'utf-8').toString('base64url')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');


  const signedToken = `${token}.${signatureData}`;

  console.log(signedToken);
  return signedToken;

};

function uint8ToUrlBase64(uint8:any) {
  let bin = '';
  uint8.forEach(function(code:any ) {
      bin += String.fromCharCode(code);
  });
  return bin;
}
