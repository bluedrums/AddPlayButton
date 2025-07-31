import "server-only";

export const fetchPlayButton = async (fid: number, id: string) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
    const apiUrl = `${baseUrl}/api/playbutton?id=${id}`;
    
    console.log(`fetchPlayButton: fetching ${apiUrl} with fid ${fid} in header`);

    const response = await fetch(apiUrl, {
      headers: {
        'x-user-fid': fid.toString(),
      },
      next: { revalidate: 10 } // Revalidate every 10 seconds
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch play button. Status: ${response.status}, Body: ${await response.text()}`);
      return null;
    }
    const data = await response.json();
    if (data.error) {
      console.error(`API Error fetching play button: ${data.error}`);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in fetchPlayButton:', error);
    return null;
  }
}; 