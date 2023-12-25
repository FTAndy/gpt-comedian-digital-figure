import 'dotenv/config'
// import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import {getSubtitleSRTFileFromList} from './getSubtitleSRTFile';
import filedData from './data.json'
import openai from './openai'
import type { MessageContentText } from 'openai/src/resources/beta/threads/messages/messages'
import { resolve } from 'path';

puppeteer.use(StealthPlugin())

type comedianInfo = {
  name: string
  profileLink: string
  imdbID: string
}

export function getRandom(toTime = 5) {
  return Math.floor(Math.random() * toTime) + 1;
}

export async function exists(page: Page, elementName: string) {
  return page.evaluate((name) => {
    return document.querySelector(name)?.innerHTML;
  }, elementName);
}

export function getTheHighestResolutionImg(imgURLs: Array<string>) {
  if ((imgURLs as Array<string>)?.length > 0) {
    const urlString = imgURLs[imgURLs.length - 1];
    const highResolutionUrl = /(.+) (?:.+w)/.exec(urlString);
    return highResolutionUrl?.[1] || '';
  }
  return '';
}

export async function getComedianProfile(browser: Browser, comedianName: string) {
  function createTask(comedianName: string) {
    return async (): Promise<comedianInfo> => {
      const ImdbPage = await browser.newPage();
      await ImdbPage.goto(`https://www.imdb.com/find/?q=${comedianName}`, {
        timeout: 120 * 1000
      });

      // await ImdbPage.click('#suggestion-search-button')

      await ImdbPage.waitForSelector('[data-testid="find-results-section-name"]')

      await ImdbPage.evaluate(() => {
        const button = document.querySelector('[data-testid="find-results-section-name"] .ipc-metadata-list-summary-item__t');
        button && (button as HTMLAnchorElement).click();
      });

      // await ImdbPage.click('.ipc-metadata-list-summary-item__t')

      await ImdbPage.waitForSelector('.ipc-page-content-container')

      const comedianInfo = await ImdbPage.evaluate(() => {
        return {
          profileLink: location.href,
          imdbID: (/https:\/\/www.imdb.com\/name\/(?:(.+))\?.+/.exec(location.href)?.[1] as string)
        }
      })
      await ImdbPage.close()
      return {
        name: comedianName,
        ...comedianInfo
      }
    }
  }
  return createTask(comedianName)()
}


export async function getSpecials(browser: Browser, imdbURL: string) {

  const profilePage = await browser.newPage();

  await profilePage.goto(imdbURL);

  await profilePage.waitForSelector('[data-testid="hero__pageTitle"] span');

  const comedianName =
    (await profilePage.evaluate(() => {
      return document.querySelector('[data-testid="hero__pageTitle"] span')
        ?.innerHTML;
    })) || '';

  let flag = true;

  while (flag) {
    const isThereATag = await exists(profilePage, '.ipc-chip--active');
    if (isThereATag) {
      await profilePage.click('.ipc-chip--active');
      await profilePage.waitForTimeout(1000 * getRandom());
    } else {
      flag = false;
    }
  }

  await profilePage.click('#name-filmography-filter-writer');

  setTimeout(async () => {
    try {
      if (profilePage && !profilePage.isClosed()) {
        const errorExist = await exists(profilePage, '[data-testid="retry-error"]');
        if (errorExist) {
          await profilePage.click('[data-testid="retry"]');
        }
      }      
    } catch (error) {
      
    }
  }, 5000);

  await profilePage.waitForSelector('.filmo-section-writer');

  await profilePage.exposeFunction(
    '_getTheHighestResolutionImg',
    getTheHighestResolutionImg,
  );

  // const avatarImgURL = await profilePage.evaluate(async () => {
  //   const element = document.querySelector('.photos-image .ipc-image');
  //   const imgURLs = (element as any)?.srcset.split(', ');
  //   const highResolutionUrl = (window as any)._getTheHighestResolutionImg(
  //     imgURLs,
  //   );
  //   return highResolutionUrl;
  // });

  const hasSeeMoreButton = await profilePage.evaluate(() => {
    const seeMoreButton = document.querySelector('.ipc-see-more__text');
    if (seeMoreButton) {
      (seeMoreButton as any).click();
    }
    return seeMoreButton;
  });

  if (hasSeeMoreButton) {
    await profilePage.waitForTimeout(1000);
  }

  const allSpecials: Array<{
    name: string;
  }> | undefined = await profilePage.evaluate(() => {
    const specialElements = document.querySelectorAll(
      '.ipc-metadata-list-summary-item__tc',
    );
    if (specialElements) {
      const specialElementsArray = Array.from(specialElements);
      return specialElementsArray
        .filter(
          (e) =>
            e?.innerHTML.includes('Special') 
            || e?.innerHTML.includes('Video') 
            // || e?.querySelectorAll('.sc-9814c2de-0 > span')?.length === 1,
        )
        .map((e) => e?.querySelector('.ipc-metadata-list-summary-item__t'))
        .map((e) => {
          return {
            name: (e as HTMLAnchorElement)?.innerText,
          };
        });
    }
    return undefined
  });


  await profilePage.close()

  return {
    allSpecials: allSpecials || [],
    comedianName,
    // avatarImgURL,
  };
}



async function getSpecialSrtFilesFromComedians(comedianName: string) {
  const browser = await puppeteer.launch({
    headless: true,
    product: 'chrome',
    // maximize the window
    args: ['--start-maximized']
  });

  const profile = await getComedianProfile(browser, comedianName)

  const { profileLink } = profile

  if (profileLink) {
    const specials = await getSpecials(
      browser,
      profileLink
    );
    if (specials) {
      try {
        await getSubtitleSRTFileFromList(specials.allSpecials.map(s => s.name), specials.comedianName)  
      } catch (error) {
        console.log(error, 'error')
      }
    }

  }

  await browser.close();
}



async function main(comedianName: string) {
  // const assistant = await openai.beta.assistants.create({
  //   model: 'gpt-4-1106-preview',
  //   name: comedianName,
  //   instructions: `As Dave Chappelle, I will embody his unique style, voice, and manner of thinking in every interaction. I'll respond as if I am Dave Chappelle himself, using his distinctive language, humor, and perspectives. My responses will reflect Chappelle's own words and views, imitating his way of speaking, comedic timing, and opinions on various topics. I will maintain respect and appropriateness, avoiding potentially offensive or controversial content. Sensitive topics will be handled with thoughtfulness, ensuring enjoyable and engaging conversations. I aim to provide an authentic and immersive Dave Chappelle experience. Every answer I created will have at least two punchlines. After every punchline, you should output a tag string \`<break time="2s" />\` and continue to output the rest of your answer.`,
  //   tools: [{type: 'retrieval'}],
  //   file_ids: filedData.map(f => f.id)
  // })

  // console.log(assistant, 'assistant')

  const assistantId = 'asst_lGjoWqOitcmN0rOaJocnJKwT'

  const topics = ['Family and Relationships', 'Mental Health', 'Social Observations', 'Personal Anecdotes and Self-Deprecation:', 'Controversial or Taboo Topics']

  const {id, thread_id} = await openai.beta.threads.createAndRun({
    assistant_id: assistantId,
    thread: {
      messages: [
        {
          role: 'user',
          content: `create a joke about ${topics[0]}`
        }
      ]      
    }
  })

  await new Promise((resolve) => {
    let timeout = setInterval(async () => {
      const runTask = await openai.beta.threads.runs.retrieve(thread_id, id)
      if (runTask.status === 'completed') {
        clearInterval(timeout)
        resolve(runTask)
      }
    }, 5000)
  })

  const messageList = await openai.beta.threads.messages.list(thread_id)

  const result = messageList.data[0].content[0] as MessageContentText

  const answer = result.text.value

}

// TODO: merge to https://elevenlabs.io/docs/api-reference/text-to-speech

main('Dave Chappelle')