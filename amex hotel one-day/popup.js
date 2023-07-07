if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

/////

const tabs = await chrome.tabs.query({
    url: [
      'https://www.amextravel.com/hotel-searches/*',
    ]
  });

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator
const collator = new Intl.Collator()
tabs.sort((a, b) => collator.compare(a.tabIds, b.tabIds))

const lastTab = tabs[tabs.length-1]
const template = document.getElementById('li_template');

function clearElements() {
  const searchResult = document.getElementById('searchResult')
  searchResult.removeChild(searchResult.firstChild)
  searchResult.appendChild(document.createElement('ul'))
}

function addElement(title, desc) {
  const element = template.content.firstElementChild.cloneNode(true)
  element.querySelector('.title').textContent = title
  element.querySelector('.pathname').textContent = desc
  document.querySelector('ul').append(element);
}

chrome.runtime.onMessage.addListener(
  function(rq, sender, sendResponse) {
    rq = rq || {}
    if (sender.tab.id != lastTab.id)
      return
    if (rq.searchOneResult != null) {
      // let hotels = rq.searchOneResult
      // console.log('amexHotelsOneDayReply hotels', JSON.stringify(hotels))      
      chrome.storage.sync.get('amexHotelsOneDayResults', function(items) {
        const prevHotels = items.amexHotelsOneDayResults || []
        var hotelsMap = {}
        prevHotels.forEach((h, idx) => hotelsMap[h.checkinDate+h.hotelName] = h);
        // console.log('amexHotelsOneDayReply hotelsMap prevHotels', hotelsMap)
        rq.searchOneResult.forEach((h, idx) => hotelsMap[h.checkinDate+h.hotelName] = h);
        // console.log('amexHotelsOneDayReply hotelsMap rq.searchOneResult', JSON.stringify(hotelsMap))
        let hotels = []
        for (const [k, v] of Object.entries(hotelsMap)) {
          hotels.push(v)
        }
        // console.log('amexHotelsOneDayReply hotelsMap', hotels)
        hotels.sort((a, b) => new Intl.Collator(undefined, { numeric: true}).compare(a.price, b.price))
        // keep 50 max
        hotels.length = Math.min(hotels.length, 50);
        chrome.storage.sync.set({ amexHotelsOneDayResults: hotels })
        clearElements()
        for (const h of hotels) {
          let title = "{0} - {1}".format(h.price, h.checkinDate)
          addElement(title, h.hotelName)
        }
      });
    }
  }
);

function searchOne() {
  chrome.tabs.sendMessage(lastTab.id, {greeting: "searchOne"})
}

function addSearchResult() {
  chrome.tabs.sendMessage(lastTab.id, {greeting: "getSearchResult"}, function(rs) {
      rs = rs || {}
      if (rs.searchResult == null)
        return
      for (const h of rs.searchResult) {
        addElement(h.hotelName, h.price)
      }
  })
}

function viewExistingResult() {
  clearElements()
  chrome.storage.sync.get('amexHotelsOneDayResults', function(items) {
    const prevHotels = items.amexHotelsOneDayResults || []
    for (const h of prevHotels) {
      let title = "{0} - {1}".format(h.price, h.checkinDate)
      addElement(title, h.hotelName)
    }
  });
}

// addSearchResult()
// searchOne()
//viewExistingResult()

const btnSearch = document.getElementById("search")
btnSearch.onclick = searchOne

const btnLoad = document.getElementById("load")
btnLoad.onclick = viewExistingResult



