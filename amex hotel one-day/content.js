function waitForElm(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

/////

function getSearchResult() {
  searchResult = []
  const checkin = document.getElementById('checkin').value
  const hotelCardsList = document.querySelector('.HotelCardsList')
  hotelCardsList.childNodes.forEach(function(hotelCard) {
    programLogo = hotelCard.querySelector('.ProgramLogo--FHR')
    if (programLogo == null)
      return
    rateAmount = hotelCard.querySelector('.AvgNightlyRate-amount')
    if (rateAmount == null)
      return
    data = {
      hotelName: hotelCard.querySelector('.HotelInfo-name').textContent,
      checkinDate: checkin,
      price: Number(rateAmount.textContent.replace(/[^0-9.-]+/g,""))
    }
    searchResult.push(data)
  })
  return searchResult
}

function searchOne(msg) {
  // adjust checkout date first
  document.getElementById('checkout').click(); 
  let rangeEnd = document.getElementById('checkout-dropdown-block-content').querySelector(".Calendar-day--rangeEnd")
  rangeEndSet = false
  if (rangeEnd.parentElement.nextSibling != null) {
    rangeEnd.parentElement.nextSibling.children[0].click()
    rangeEndSet = true
  }
  if (!rangeEndSet && rangeEnd.parentElement.parentElement.nextSibling != null) {
    rangeEnd.parentElement.parentElement.nextSibling.children[0].children[0].click()
    rangeEndSet = true
  }
  if (!rangeEndSet && rangeEnd.parentElement.nextSibling.children[0].classList.contains("Calendar-day--outside")) {
    Array.from(rangeEnd.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.querySelectorAll(".Calendar-day"))
        .find(el => (el.textContent === '1' && !el.classList.contains("Calendar-day--outside")))
        .children[0]
        .click()
  }
  // after checkout adjusted, now adjust checkin
  document.getElementById('checkin').click(); 
  let rangeStart = document.getElementById('checkin-dropdown-block-content').querySelector(".Calendar-day--rangeStart")
  rangeStartSet = false
  if (rangeStart.parentElement.nextSibling != null) {
    rangeStart.parentElement.nextSibling.children[0].click()
    rangeStartSet = true
  }
  if (!rangeStartSet && rangeStart.parentElement.parentElement.nextSibling != null) {
    rangeStart.parentElement.parentElement.nextSibling.children[0].children[0].click()
    rangeStartSet = true
  }
  if (!rangeStartSet && rangeStart.parentElement.nextSibling.children[0].classList.contains("Calendar-day--outside")) {
    Array.from(rangeStart.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.querySelectorAll(".Calendar-day"))
        .find(el => (el.textContent === '1' && !el.classList.contains("Calendar-day--outside")))
        .children[0]
        .click()
  }
  document.getElementById('hotel.update_search').click()
  waitForElm('.HotelCardsList').then((elm) => {
    chrome.runtime.sendMessage({
      searchOneResult: getSearchResult()
    });
  });
}

window.onload = function() {
  chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
    console.log('onMessage', msg);
    if (msg.greeting == "hello") {
      sendResponse({farewell: "goodbye"});
    } else if (msg.greeting == "getSearchResult") {
      sendResponse(getSearchResult());
    } else if (msg.greeting == "searchOne") {
      searchOne(msg);
    } else {
      sendResponse({});
    }
  });
};