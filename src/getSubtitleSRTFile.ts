import 'dotenv/config'
// import 'global-agent/bootstrap';
import axios from 'axios'
import fs from 'fs'
import fetch from 'node-fetch';
import fsPromise from 'fs/promises'
import path from 'path'
import openai from './openai'
import { maxLimitedAsync } from './utils'
const OpenSubtitles = require('opensubtitles-node-sdk');

let os: any

async function initOS() {
  os = new OpenSubtitles({
    apikey: process.env.OPEN_SUBTITLE,
    headers: {
      'User-Agent': 'family v0.1'
    }
  })

  await os.login({
    username: process.env.OPEN_SUBTITLE_USERNAME,
    password: process.env.OPEN_SUBTITLE_PASSWORD
  })
}

export default async function getSubtitleSRTFile(specialName: string, storePath: string, format = 'srt') {
  if (!os) {
    await initOS()
  }

  const queryName = specialName

  const response = await os.subtitles({
    query: queryName
  })

  const fileId = response?.data[0]?.attributes?.files[0]?.file_id

  if (fileId) {
    const downloadResponse = await os.download({
      file_id: fileId
    })

    const link = downloadResponse?.link
    if (link) {
      const file = await openai.files.create({ file: await fetch(link), purpose: 'assistants' });
      return file
      // const response = await axios({
      //   method: 'get',
      //   url: link,
      //   responseType: 'stream'
      // })
      // const srtFile = path.resolve(
      //   storePath,
      //   // trimSpecial(`${comedianName}-${specialName}-${subtitle.lan}.srt`),
      //   specialName + '.srt'
      // );

      // response.data.pipe(fs.createWriteStream(srtFile));
    }
    
  }

}


export async function getSubtitleSRTFileFromList (list: Array<string>, comedianName: string) {
  const tempDir = path.resolve(
    __dirname,
    'temp',
  );


  const comedianDir = path.resolve(
    __dirname,
    'temp',
    // trimSpecial(`${comedianName}-${specialName}-${subtitle.lan}.srt`),
    comedianName
  );

  try {
    await fsPromise.mkdir(tempDir) 
    await fsPromise.mkdir(comedianDir) 
  } catch (error) {
    console.log('error', error)
  }

  const files = await maxLimitedAsync({
    max: 3,
    tasks: list.map(specialName => {
      return () => getSubtitleSRTFile(specialName, comedianDir)
    })
  })
  console.log(files, 'files')
  return files.filter(f => f)
}
