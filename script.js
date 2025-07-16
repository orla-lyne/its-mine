const defaultfeeds =[
     { id: 'bbc', name: 'BBC  (Top Stories)', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
     { id: 'cnn', name: 'CNN (Top Stories)', url: 'http://rss.cnn.com/rss/cnn_topstories.rss' },
     { id: 'nyt-world', name: 'NYT  (World)', url: 'https://www.nytimes.com/services/xml/rss/nyt/World.xml' },
     { id: 'al-jazeera',name:'Al Jazeera (English)', url:'https://www.aljazeera.com/xml/rss/all.xml' },
     { id: 'npr', name: 'NPR (Top Stories)', url: 'https://www.npr.org/rss/rss.php?id=1001' },
     { id: 'pbs', name: 'PBS (World)', url: 'https://www.pbs.org/newshour/feeds/rss/podcasts/world' },
     { id: 'new-york', name: 'New York Times (World)', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'},
     { id: 'the guardian', name: 'The Guardian (World) ', url: 'https://www.theguardian.com/world/rss'},
        
];


const feedlistelement = document.getElementById('feed-list');
const newsContainer = document.querySelector('.news-container');

const addfeedbutton = document.getElementById('add-feed');
const deletefeedbutton = document.getElementById('delete-feed');
const closefeedformbutton = document.getElementById('close-feed')
const refreshfeedbutton = document.getElementById('refresh');
const mainheadings = document.querySelector('.feed-heading')
const loaderText = document.querySelector('.loader-text'); 
const errorMessage = document.querySelector('.error-message'); 
const Spinner = document.querySelector('.spinner');
const feedformcontainer = document.querySelector('.feed-form1');
const addFeedForm = document.getElementById('feed-form');
const addnewfeedurl = document.getElementById('Feed-Url'); 
const addnewfeedname = document.getElementById('Feed-Name'); 
const savefeedbutton = document.getElementById('save');




let currentfeeds = JSON.parse(localStorage.getItem('rssFeeds')) || defaultfeeds;
let selectedfeedUrl = '';

let currentlyActiveItem = null; 

function showLoading() {
    newsContainer.innerHTML = ''; 
    if (loaderText) loaderText.style.display = 'flex'; 
    if (errorMessage) errorMessage.style.display = 'none'; 
    const initialMessage = newsContainer.querySelector('h2');
    if (initialMessage) initialMessage.style.display = 'none';
    
}

function hideLoading() {
    if (loaderText) loaderText.style.display = 'none';
}

function showErrorMessage(message) {
    if (errorMessage) {
 
        errorMessage.textContent = message; 
        errorMessage.style.display = 'block';
    }
    hideLoading(); 
    const initialMessage = newsContainer.querySelector('h2');
    if (initialMessage) initialMessage.style.display = 'none';
}

function hideErrorMessage() {
    if (errorMessage) errorMessage.style.display = 'none';
}

  function renderfeedlist() { 
    feedlistelement.innerHTML = ''; 
    currentfeeds.forEach(feed => {
        const listitem = document.createElement('li');
        listitem.textContent = feed.name;
        listitem.className = 'feed-li-el'; 
        listitem.dataset.url = feed.url;
        listitem.dataset.name = feed.name;
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
        localStorage.clear();

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
                <h3> ${article.title.toUpperCase()}</h3> 
                ${article.imageUrl ? `<div class="article-image"><img src="${article.imageUrl}" alt="${article.title || 'News Image'}" /></div>` : ''}
                <small>${new Date(article.pubDate).toLocaleDateString()} ${new Date(article.pubDate).toLocaleTimeString()}</small>
                <p>${article.description}</p>
                <a href='${article.link}' target='_blank'>Read More</a>
            `;
            newsContainer.appendChild(newsEl);
            localStorage.clear();
        });
    } else {
        newsContainer.innerHTML = '<p class="empty-message">No articles found for this feed.</p>';
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
  
   async function selectedfeed(url , name) {
    selectedfeedUrl = url ;
    localStorage.setItem('selectedfeedurl', url)


    if (mainheadings) {
        mainheadings.innerHTML = `<h1><span>${name}</span>   News</h1>`;
    }

    showLoading();
    hideErrorMessage();
    try {
        const articles = await fetchAndParseRssFeed(url);
        displayNews(articles);
        localStorage.clear();
    } catch (error) {
        console.error('Error fetching and displaying feed:', error);
        showErrorMessage(`Failed to load feed: ${error.message || 'Unknown error'}. Please check the URL or try again later.`);
        displayNews([]); 
    
       
    } finally {
        
        hideLoading(); 
    }
}

const refreshinterval = 10*60*1000

let refreshtimer ;
function startAutoRefresh() {
    
    if (refreshtimer) {
        clearInterval(refreshtimer);
    }
    
    refreshtimer = setInterval(() => {
        console.log(`Auto-refreshing news for: ${selectedfeedurl}`);
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


   
console.log("Setting up DOMContentLoaded listener.");
document.addEventListener('DOMContentLoaded', () => {

    renderfeedlist();
    if (currentfeeds.length > 0) {
        const initialFeed = currentfeeds.find(feed => feed.url === selectedfeedUrl) || currentfeeds[0];

        if (initialFeed) {
            selectedfeed(initialFeed.url, initialFeed.name);
            startAutoRefresh();
        } else {
            console.log("Previously selected feed not found among current feeds. Resetting selection.");
            selectedfeedUrl = ''; 
            localStorage.removeItem('selectedfeedUrl'); 
            newsContainer.innerHTML = '<h2>Select a Feed or Add a New One.</h2>';
            if (mainheadings) {
                mainheadings.innerHTML = '<h1>Welcome! <span>Select a Feed</span></h1>';
            }
            hideLoading();
            hideErrorMessage();
        }
    } else {
        
        if (mainheadings) {
            mainheadings.innerHTML = '<h1>Welcome! <span>Add a Feed to Start</span></h1>';
        }
        newsContainer.innerHTML = '<h2>Add your first news feed to get started!</h2>';
        hideLoading();
        hideErrorMessage();
    }
});


function refreshFeed() {
    console.log("Manual refresh triggered.");
    if (selectedfeedUrl) {
        const foundFeed = currentfeeds.find(feed => feed.url === selectedfeedUrl);
        if (foundFeed) {
            selectedfeed(foundFeed.url, foundFeed.name);
            startAutoRefresh(); 
        } else {
            console.warn("Selected feed not found in currentFeeds for refresh.");
            alert('The previously selected feed could not be found. Please select another feed.');
            displayNews([]);
            selectedfeedUrl = '';
            localStorage.removeItem('selectedfeedUrl');
            localStorage.clear();
            stopAutoRefresh();
        }
    } 
}

if (refreshfeedbutton) {
    refreshfeedbutton.addEventListener('click', refreshFeed);
}

 if (addfeedbutton) {
    addfeedbutton.addEventListener('click', () => {
        if (feedformcontainer) {
            feedformcontainer.style.display = 'flex'; 
        }
        hideErrorMessage(); 
    });
}

if (closefeedformbutton) {
    closefeedformbutton.addEventListener('click', () => {
        console.log('close')
        if (feedformcontainer) feedformcontainer.style.display = 'none'; 
        if (addFeedForm) addFeedForm.reset(); 
        hideErrorMessage(); 
    });
}

if (deletefeedbutton) {
    deletefeedbutton.addEventListener('click', () => { 
        const activeItem = document.querySelector('.feed-li-el.active-li');
        if (!activeItem) {
            alert('Please select a feed to delete.');
            return;
        }

        const urlToDelete = activeItem.dataset.url;
        const nameToDelete = activeItem.dataset.name; 

        if (confirm(`Are you sure you want to delete "${nameToDelete}"?`)) {
            currentfeeds = currentfeeds.filter(feed => feed.url !== urlToDelete);
            localStorage.setItem('rssFeeds', JSON.stringify(currentfeeds));
            renderfeedlist(); 

            if (selectedfeedUrl === urlToDelete) {
                
                newsContainer.innerHTML = '<h2>Select a Feed or Add a New One.</h2>';
                if (mainheadings) { 
                    mainheadings.innerHTML = '<h1>Welcome! <span>Select a Feed</span></h1>';
                }
                selectedfeedUrl = ''; 
                localStorage.removeItem('selectedfeedurl'); 
                stopAutoRefresh(); 
            }
            hideErrorMessage();
        }
    });
}


if (savefeedbutton) {
    savefeedbutton.addEventListener('submit', (event) => {
        event.preventDefault(); 

        const url = addnewfeedurl.value.trim();
        const name = addnewfeedname.value.trim();

        if (url && name) {
            try {
                new URL(url); 
                const newFeed = {
                    id: 'custom-' + Date.now(),
                    name: name,
                    url: url
                };
                const isDuplicate = currentfeeds.some(feed => feed.url === newFeed.url);
                if (isDuplicate) {
                    showErrorMessage('This feed URL already exists.');
                    return;
                }
                currentfeeds.push(newFeed);
                localStorage.setItem('rssFeeds', JSON.stringify(currentfeeds));
                renderfeedlist(); 
                selectedfeed(newFeed.url, newFeed.name); 
                startAutoRefresh(); 
                hideErrorMessage();
                savefeedbutton.reset(); 
                if (feedformcontainer) feedformcontainer.style.display = 'none'; 
            } catch (e) {
                showErrorMessage('Invalid URL format. Please enter a valid URL.');
            }
        } else {
            showErrorMessage('Please fill in both Feed Name and URL.');
        }
    });
}



 
  
