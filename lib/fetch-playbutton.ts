import "server-only";

export const fetchPlayButton = async (fid: number, id: string) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://addplaybutton.xyz';
    const apiUrl = `${baseUrl}/api/playbutton?fid=${fid}&id=${id}`;
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 10 } // Revalidate every 10 seconds
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch play button. Status: ${response.status}`);
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