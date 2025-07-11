const defaultfeeds =[
     { id: 'bbc', name: 'BBC News  Top Stories', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
        { id: 'cnn', name: 'CNN Top Stories', url: 'http://rss.cnn.com/rss/cnn_topstories.rss' },
        { id: 'nyt-world', name: 'NYT  World', url: 'https://www.nytimes.com/services/xml/rss/nyt/World.xml' },
        { id: 'al-jazeera',name:'Al Jazeera English', url:'https://www.aljazeera.com/xml/rss/all.xml' },
        { id: 'npr', name: 'NPR Top Stories', url: 'https://www.npr.org/rss/rss.php?id=100' },
        { id: 'techcrunch', name: 'TechCrunch', url: 'http://feeds.feedburner.com/TechCrunch/' },
        { id: 'new-york', name: 'New York Times (World)', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml '},
        { id: 'the guardian', name: 'The Guardian (World)', url: 'https://www.theguardian.com/world/rss'},
        { id: 'reuters', name: 'Reuters News Top Stories', url: 'http://feeds.reuters.com/reuters/topNews'},
        
];


const feedlistelement = document.getElementById('feed-list');
const addnewfeedurl = document.getElementById ('feed-url');
const newsContainer = document.querySelector('.news-container')

const addfeedbutton = document.getElementById('myimageicon');
const deletefeedbutton = document.getElementById('myicon');
const refreshfeed = document.getElementById('refresh');
const loadingfeeds = document.getElementsByClassName('.loader-text');
const errormessage =  document.getElementsByClassName('.errormessage');



let currentfeeds = JSON.parse(localStorage.getItem('rssFeeds')) || defaultfeeds;
let selectedfeedUrl = '';

let currentlyActiveItem = null; 

  function renderfeedlist() { 
    feedlistelement.innerHTML = ''; 
    currentfeeds.forEach(feed => {
        const listitem = document.createElement('li');
        listitem.textContent = feed.name;
        listitem.className = 'feed-li-el'; 
        listitem.dataset.url = feed.url;

        if (feed.url === selectedfeedUrl) { 
            listitem.classList.add('active-li');
            currentlyActiveItem = listitem; 
        }

        
        listitem.addEventListener('click', () => {
            
            if (currentlyActiveItem) {
                currentlyActiveItem.classList.remove('active-li');
            }
            
            listitem.classList.add('active-li');
            currentlyActiveItem = listitem; 
            
            selectedfeed(feed.url, feed.name); 
        });

        feedlistelement.appendChild(listitem);
    });
}
renderfeedlist();

function displayNews(articles) {
    if (!newsContainer) {
        console.error("Error: '.news-container' not found. Make sure the element exists in your HTML.");
        return;
    }

    newsContainer.innerHTML = '';

    if (articles && Array.isArray(articles) && articles.length > 0) {
        articles.forEach(article => {
            const newsEl = document.createElement('div');
            newsEl.className = 'news-card'; 

            newsEl.innerHTML = `
                <h3><a href="${article.link}" target="_blank" rel="noopener noreferrer">${article.title}</a></h3>
                <small>${new Date(article.pubDate).toLocaleDateString()} ${new Date(article.pubDate).toLocaleTimeString()}</small>
                ${article.imageUrl ? `<div class="article-image"><img src="${article.imageUrl}" alt="${article.title || 'News Image'}" /></div>` : ''}
                <p>${article.description}</p>
                <a href='${article.link}' target='_blank'>Read More</a>
            `;
            newsContainer.appendChild(newsEl);
        });
    } else {
        newsContainer.innerHTML = '<p class="empty-message">No news articles found in this feed.</p>';
        console.log("No articles found or the articles array is empty."); 
    }

}

async function fetchAndParseRssFeed(rssUrlToFetch) { 
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrlToFetch)}`;
    console.log('Fetching from proxy URL:', proxyUrl);

    try {
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for URL: ${rssUrlToFetch}`);
        }

        const data = await response.json(); 
        if (data.status !== 'ok') {
            throw new Error(`RSS2JSON API Error: ${data.message || 'Unknown API error'} for feed: ${rssUrlToFetch}`);
        }

        const items = data.items;
        if (!items || !Array.isArray(items)) {
            console.warn('RSS2JSON API response did not contain a valid "items" array:', data);
            return []; 
        }

        console.log('JSON items (articles) from rss2json:', items);

        const articles = items.map(item => { 
            const title = item.title || "No Title";
            const link = item.link || "#";
            const pubDate = item.pubDate || "No Date";
            const rawDescription = item.description || "No Description";

            const cleanDescription = new DOMParser().parseFromString(rawDescription, 'text/html').body.textContent || rawDescription;

            let imageUrl = "";

            if (item.enclosure && item.enclosure.link) {
                imageUrl = item.enclosure.link;
                
            } else if (item.thumbnail) { 
                imageUrl = item.thumbnail;
            } else if (item.image && item.image.url) { 
                imageUrl = item.image.url;
            } else if (item.media && item.media.thumbnail && item.media.thumbnail.length > 0) {
                imageUrl = item.media.thumbnail[0].url;
            } else { 
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = rawDescription;
                const img = tempDiv.querySelector("img");
                if (img?.src) {
                    imageUrl = img.src;
                }
            }
            if (imageUrl && !imageUrl.startsWith('http')) {
                let articleBaseUrl;
                try {
                    articleBaseUrl = new URL(link);
                } catch (e) {
                    console.warn(`Invalid article link "${link}" for relative image "${imageUrl}". Skipping URL resolution.`, e);
                    imageUrl = '';
                }

                if (articleBaseUrl) {
                    try {
                        imageUrl = new URL(imageUrl, `${articleBaseUrl.protocol}//${articleBaseUrl.host}`).href;
                    } catch (e) {
                        console.warn(`Could not resolve relative image URL "${imageUrl}" from base "${articleBaseUrl.href}":`, e);
                        imageUrl = '';
                    }
                }
            }
            return {
                title,
                link,
                pubDate,
                description: cleanDescription,
                imageUrl
            };
        });

        console.log("Parsed Articles:", articles);
        return articles; 
    } catch (error) {
        console.error("Error in fetchAndParseRssFeed:", error);
        throw error; 
    }
}
  console.log()
   async function selectedfeed(url , name) {
    selectedfeedUrl = url ;
    try {
        const articles = await fetchAndParseRssFeed(url);
        displayNews(articles);

    } catch (error) {
        console.error('Error fetching and displaying feed:', error);
        
        displayNews([]); 
    
       
    }
}
   

 const refreshinterval = 10*60*1000

let refreshtimer ;
function startAutoRefresh() {
    
    if (refreshtimer) {
        clearInterval(refreshtimer);
    }
    
    refreshtimer = setInterval(() => {
        console.log(`Auto-refreshing news for: ${selectedfeedURL}`);
        fetchNews(); 
    }, refreshinterval);
    console.log(`Auto-refresh set to ${refreshinterval / 1000 / 60} minutes.`);

   
}

function stopAutoRefresh() {
    if (refreshtimer) {
        clearInterval(refreshtimer);
        console.log("Auto-refresh stopped.");

        stopAutoRefresh();
    }
}


refreshfeed.addEventListener('click', () => {
    console.log("Manual refresh triggered.");
    fetchNews();         
    startAutoRefresh(); 
});

 
  
