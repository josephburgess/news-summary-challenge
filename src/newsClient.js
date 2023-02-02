const API_KEY = require('./apiKey.js');

class NewsClient {
  loadNews(callback) {
    fetch(
      `https://content.guardianapis.com/search?show-fields=thumbnail%2Cheadline%2Cbyline%2Cstandfirst&page-size=40&section=world&api-key=${API_KEY}`
    )
      .then((response) => response.json())
      .then((data) => {
        callback(data);
      });
  }

  searchNews(searchTerm, callback) {
    fetch(
      `https://content.guardianapis.com/search?q=${searchTerm}&page-size=40&query-fields=headline&show-fields=thumbnail,headline,byline,standfirst&order-by=newest&api-key=${API_KEY}`
    )
      .then((response) => response.json())
      .then((data) => {
        callback(data);
      });
  }

  filterNews(section, callback) {
    fetch(
      `https://content.guardianapis.com/search?section=${section}&page-size=40&show-fields=thumbnail,headline,byline,standfirst&order-by=newest&api-key=${API_KEY}`
    )
      .then((response) => response.json())
      .then((data) => {
        callback(data);
      });
  }
}

module.exports = NewsClient;
