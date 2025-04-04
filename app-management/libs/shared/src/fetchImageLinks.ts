import { exec } from 'child_process';
import * as probe from 'probe-image-size';
import { Readable } from 'stream';

async function getAspectRatio(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'cache-control': 'max-age=0',
        'if-modified-since': 'Thu, 08 Aug 2024 17:23:52 GMT',
        'if-none-match': '"af3f3f173fd9fe61e69ddefcdef2232a"',
        priority: 'u=0, i',
        'sec-ch-ua':
          '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        cookie:
          '__cf_bm=71bKI8HY51Wew3Mb9fj9NTmU005SC9GlLKzkeJOafwI-1737174284-1.0.1.1-2S3SBVOifjx6tckVLm5Mz6T3dCUp6bLFhIHTtUWbtmG4DtLwWsLJfpsXwAams9FS8bmTnRP4deAXOdSUbQ8COQ',
      },
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: null,
      method: 'GET',
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // Readable.from is working with this stream but not mentioned in the types
    const result = await probe(Readable.from(response.body));

    if (result.width && result.height) {
      const width = result.width;
      const height = result.height;

      const aspectRatio = (width / height).toFixed(2);
      console.log(
        `Aspect Ratio: ${aspectRatio} (Width: ${width}, Height: ${height})`,
      );

      return aspectRatio;
    } else {
      console.error('Invalid image dimensions returned');
      return null;
    }
  } catch (error) {
    console.error('Error fetching image dimensions:', error);
    return null;
  }
}

async function getAspectRatioImages(prompt: string): Promise<string[]> {
  const image_links = await fetchImageLinks(
    `image for ${prompt.replace(/[']/g, '')} in 16:9 aspect ratio`,
  );
  console.log(image_links);
  return (
    await Promise.all(
      image_links.map(async (imageUrl) => {
        try {
          const aspectRatio = await getAspectRatio(imageUrl);
          return aspectRatio === '1.78' ? imageUrl : null;
        } catch (error) {
          console.log('error' + error);
          return null;
        }
      }),
    )
  ).filter(Boolean); // Remove null values
}

export async function generageImageRPC(prompt: string): Promise<string[]> {
  console.log("RPC Call top");
  //https://009c-2401-4900-883d-cab9-4889-83ef-c7cc-c5bc.ngrok-free.app/
  const serviceKey = process.env.SERVICE_KEY;
  const imageService = process.env.IMAGE_SERVICE;
  const response = await fetch(`${imageService}/ai/images/scene-images?key=${serviceKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ visualDesc: prompt }),
  });

  if (!response.ok) {
    return null;
  } else{
  console.log(JSON.stringify(response));
  const data = await response.json();
  const image_links = data?.links || [];
  console.log("RPC Call");
  console.log(image_links);
  return (
    await Promise.all(
      image_links.map(async (imageUrl) => {
        try {
          const aspectRatio = await getAspectRatio(imageUrl);
          return aspectRatio === '1.78' ? imageUrl : null;
        } catch (error) {
          console.log('error' + error);
          return null;
        }
      }),
    )
  ).filter(Boolean); // Remove null values
}
}

export function fetchImageLinks(prompt: string): Promise<string[]> {
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://www.midjourney.com/api/app/vector-search?prompt=${encodedPrompt}&page=1&_ql=explore`;
  // TODO: Read cookies from environment variables
  const curlCommand = `
    curl -s '${url}' \
    -H 'accept: */*' \
    -H 'accept-language: en-GB,en-US;q=0.9,en;q=0.8' \
    -H 'referer: https://www.midjourney.com/explore' \
    -H 'sec-ch-ua: "Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"' \
    -H 'sec-ch-ua-mobile: ?0' \
    -H 'sec-ch-ua-platform: "macOS"' \
    -H 'sec-fetch-dest: empty' \
    -H 'sec-fetch-mode: cors' \
    -H 'sec-fetch-site: same-origin' \
    -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' \
    -H 'priority: u=1, i' \
    -H 'x-csrf-protection: 1' \
    -H 'cookie: AMP_MKTG_437c42b22c=JTdCJTdE; _gcl_au=1.1.1910504300.1735531725; _ga=GA1.1.1047981173.1735531725; __Host-Midjourney.AuthUserTokenV3_r=AMf-vBxFI0a-D-Iy6HzNqpZXqqoFS5J2-V3prl7zCo5YyGszICtRoeD_r5vPXKY-wMPfgmNdwX_eQlUxL15rX3GIjcTE7gV3ws3Sbd5CMC8kQ6ZMNsc9gew4rLHHqoKpDuU44mHZDXhQIJrweXyxT0Ia2HDKce3vUZ3hxaTiQlqTISo5t3y4ufnKkEY51tEq4JqN-qJPiscBgoujonAvPU3D7W11iaYEedOjh9eKL8_7l5lDedwJ9u-iTpr6GDDrQVrVOecgY-jlUlbLTyzcSns5j5-szdQFgQ; __cf_bm=8AVf4xqJMd6I9e4N3D_EpN8bOqTslyNMjUJYV2xL7VQ-1736633749-1.0.1.1-.7Strs.OkcvhT5cpdGATYuVl.1_3U8bKkAePZaBn60maWlbILKAU9WlLaqrw0ms4ZtNhUMJ4V2x9p7rwlcSEkQ; __Host-Midjourney.AuthUserTokenV3_i=eyJhbGciOiJSUzI1NiIsImtpZCI6IjQwZDg4ZGQ1NWQxYjAwZDg0ZWU4MWQwYjk2M2RlNGNkOGM0ZmFjM2UiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoidmluYXltYXZpMV8xMzU1MCIsIm1pZGpvdXJuZXlfaWQiOiI5NDIyNjdlNy1iOWE2LTQxZGQtYjljNi1kZGUxMDZlOTRlZWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vYXV0aGpvdXJuZXkiLCJhdWQiOiJhdXRoam91cm5leSIsImF1dGhfdGltZSI6MTczNTUzMjMyMiwidXNlcl9pZCI6IjF2dEdwOEFCWkVjNmVucDVlNWR3VVh3MndqQzMiLCJzdWIiOiIxdnRHcDhBQlpFYzZlbnA1ZTVkd1VYdzJ3akMzIiwiaWF0IjoxNzM2NjMzNzQ5LCJleHAiOjE3MzY2MzczNDksImVtYWlsIjoidmluYXltYXZpKzFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZGlzY29yZC5jb20iOlsiMTMyMzEzODYzMzU0NDUwMzQwNyJdLCJlbWFpbCI6WyJ2aW5heW1hdmkrMUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJkaXNjb3JkLmNvbSJ9fQ.b0Ruo5gw_ucbzU_7GM2x-2_BRzWVkuydS6C1X5yi4L5Wx3kF4oLSEkJVT91ZDJAJ6kllnV-W8qjUoADCXkMJtwsLwk060eIYGRUfpAdiqIdtCefR04lXeuS8QxqUUrYKHdwBKzIJNpcrKI7C2wMaES4oP2xh4OpgIf7BvzbnbNRVkx5fvWqSD2Gb5ZflqXei8BiqkSOt6Ispw65REEobJLXVic2I4cnkBgJCuTyfzkSSpj24OeBtvbekgbt_qcIge2kTMj5w27EWVKMA0AL9hW9ojzbgPonPTkDKQCySTtEwiwlVdPDlh4zTkR45U3WlOmoPnCAPZRw6-0aIFQmzZg; cf_clearance=zRmGdmhfcrvvviHuSW7QFgPCALHVZe3zMdYsPxnAr04-1736633749-1.2.1.1-mP88rfUm_BarRziYXA_TRZO5qtB8pNpCw_WGQ7hFCGQYJ3l_tsazDe.M911pXnU_sC_uSz9wtvGJdNrGYEgh5pLe.Yydsu6y6Xb8m9gYheGoR_X2isZGtomfs2_q9IncdbUqo0Ft35psNGcMtsNZQR5ES7Kumq9kI9pgA9220PF0DwVWyRGCHuNri.vuB74MKUEfFd7rb6W1yy1k3xzypgkT.GrmfmzIUgwDCOu0xJVL_aqNshmVhLQqJStejSSQMA3Ek9U7NRvD0CVv2MsfeDd.MItB6vGmTSaZvkg5pa4; _ga_Q0DQ5L7K0D=GS1.1.1736633750.4.0.1736633750.0.0.0; AMP_437c42b22c=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjJlZGVkZTJmNS04OGZjLTQ5ZjItYWNmOS01MGViYzE2OTJmMTQlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjI5NDIyNjdlNy1iOWE2LTQxZGQtYjljNi1kZGUxMDZlOTRlZWMlMjIlMkMlMjJzZXNzaW9uSWQlMjIlM0ExNzM2NjMzNzQ5Njk5JTJDJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJsYXN0RXZlbnRUaW1lJTIyJTNBMTczNjYzMzc2OTQ5MCUyQyUyMmxhc3RFdmVudElkJTIyJTNBNDM2JTdE'
  `;

  return new Promise((resolve, reject) => {
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing curl:', error.message);
        return reject(error);
      }

      if (stderr) {
        console.error('Curl stderr:', stderr);
        return reject(stderr);
      }

      try {
        console.log('Curl stdout:', stdout);
        const response = JSON.parse(stdout);
        const images =
          response?.jobs?.map(
            (item: any) =>
              `https://cdn.midjourney.com/${item.parent_id}/0_${item.parent_grid}.png`,
          ) || [];
        resolve(images);
      } catch (parseError) {
        console.error('Error parsing response:', parseError.message);
        resolve([]);
      }
    });
  });
}

export default getAspectRatioImages;
