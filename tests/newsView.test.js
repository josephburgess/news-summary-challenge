/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const NewsModel = require('../src/NewsModel');
const NewsView = require('../src/NewsView');
const NewsClient = require('../src/newsClient');
const mockNews = require('../mock/mockNews');
const apiData = require('../mock/mockApiData');
jest.mock('../src/NewsClient.js');

describe('NewsView', () => {
  let newsModel, newsView, newsClient;

  beforeEach(() => {
    NewsClient.mockClear();
    document.body.innerHTML = fs.readFileSync('./index.html');

    newsClient = new NewsClient();
    newsModel = new NewsModel();
    newsView = new NewsView(newsModel, newsClient);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('displayNews', () => {
    it('displays no news if empty', () => {
      newsView.displayNews();
      expect(document.querySelectorAll('.news').length).toBe(0);
    });

    it('displays a single story on page', () => {
      newsModel.getNews = jest.fn().mockReturnValue([mockNews[0]]);
      newsView.displayNews();
      expect(document.querySelectorAll('.news').length).toEqual(1);
    });

    it('displays multiple stories on page', () => {
      newsModel.getNews = jest.fn().mockReturnValue([mockNews[0], mockNews[1]]);
      newsView.displayNews();
      expect(document.querySelectorAll('.news').length).toEqual(2);
    });

    it('displays the expected number of images and links', () => {
      const news = [mockNews[0], mockNews[1]];
      newsModel.getNews = jest.fn().mockReturnValue(news);
      newsView.displayNews();
      const images = document.querySelectorAll('.news_thumbnail');
      expect(images.length).toBe(2);
      const links = document.querySelectorAll('.headline_link');
      expect(links.length).toBe(2);
      links.forEach((link, index) => {
        expect(link.getAttribute('href')).toBe(news[index].webUrl);
      });
    });

    it('should remove all news elements with #clearStories', () => {
      const newsItem = document.createElement('div');
      newsItem.className = 'news';
      newsView.mainContainer.append(newsItem);
      newsView.displayNews();
      const stories = document.querySelectorAll('.news');
      expect(stories.length).toBe(0);
    });
  });

  describe('showOverlay', () => {
    let overlay;
    let generateNewsSummarySpy;
    let closeButton;

    beforeEach(() => {
      overlay = {
        style: {
          display: 'none',
          visibility: 'hidden',
          opacity: '0',
        },
        innerHTML: '',
        querySelector: jest.fn().mockReturnValue({
          addEventListener: jest.fn(),
        }),
      };
      generateNewsSummarySpy = jest.spyOn(
        NewsView.prototype,
        'generateNewsSummary'
      );

      generateNewsSummarySpy.mockImplementation(() =>
        Promise.resolve([{ summary_text: 'Summary Text' }])
      );
      newsView.overlay = overlay;
      closeButton = { addEventListener: jest.fn() };
      overlay.querySelector.mockReturnValue(closeButton);

      newsView.showOverlay([mockNews[0]]);
    });
    afterEach(() => {
      generateNewsSummarySpy.mockReset();
    });

    it('should display the overlay', () => {
      expect(overlay.style.display).toBe('block');
      expect(overlay.style.visibility).toBe('visible');
      expect(overlay.style.opacity).toBe('1');
    });

    it('should set the innerHTML of the overlay', () => {
      expect(overlay.innerHTML).toContain(
        `<img src="${[mockNews[0]].thumbnail}"`
      );
      expect(overlay.innerHTML).toContain(`<p class="article-summary">`);
      expect(overlay.innerHTML).toContain(
        `<a href="${
          [mockNews[0]].webUrl
        }" id="full-article-link">Read Full Article</a>`
      );
      expect(overlay.innerHTML).toContain(
        `<a href="#" id="close-button">Close</a>`
      );
    });

    it('should call generateNewsSummary with the bodyText of the article', () => {
      expect(generateNewsSummarySpy).toHaveBeenCalledWith(
        [mockNews[0]].bodyText
      );
    });

    it('should add a click event listener to the close button', () => {
      expect(closeButton.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
    });
  });
  describe('displayNewsFromApi', () => {
    it('adds API data to the model', () => {
      newsClient.loadNews.mockImplementation((callback) => {
        callback(apiData);
      });
      newsView.displayNewsFromApi();
      expect(newsClient.loadNews).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function)
      );
      expect(document.querySelectorAll('.news').length).toEqual(11);
      expect(document.querySelectorAll('.news')[0].textContent).toContain(
        'UK house price growth slows'
      );
    });

    it('calls displayError when error callback is triggered', () => {
      jest.spyOn(newsView, 'displayError');
      newsView.newsClient.loadNews = jest.fn((_, errorCallback) => {
        errorCallback();
      });
      newsView.displayNewsFromApi();
      expect(newsView.displayError).toHaveBeenCalledWith(
        'Oops - API appears to be down!'
      );
    });
  });

  describe('displayNewsFromSearch', () => {
    it('searches news using the search term', () => {
      newsView.displayNewsFromSearch('UK news');
      expect(newsClient.searchNews).toHaveBeenCalledWith(
        'UK news',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('updates news data on search', () => {
      newsClient.searchNews.mockImplementation((searchTerm, callback) => {
        callback(apiData);
      });
      newsView.displayNewsFromSearch('UK news');
      expect(newsClient.searchNews).toHaveBeenCalledWith(
        'UK news',
        expect.any(Function),
        expect.any(Function)
      );
      expect(document.querySelectorAll('.news').length).toEqual(11);
      expect(document.querySelector('.news').textContent).toContain(
        'UK house price growth slows'
      );
    });

    it('calls displayError when error callback is triggered by search', () => {
      jest.spyOn(newsView, 'displayError');
      newsView.newsClient.searchNews = jest.fn((_, __, errorCallback) => {
        errorCallback();
      });
      newsView.displayNewsFromSearch('search term');
      expect(newsView.displayError).toHaveBeenCalledWith(
        'Oops - API appears to be down!'
      );
    });
  });

  describe('generateNewsSummary', () => {
    it('should call summariseText method of the newsClient', async () => {
      newsClient.summariseText = jest.fn();
      await newsView.generateNewsSummary('Summary Text');
      expect(newsClient.summariseText).toHaveBeenCalledWith('Summary Text');
    });
  });

  describe('displayNewsBySection', () => {
    it('searches news by specific sections', () => {
      newsView.displayNewsBySection('commentisfree');
      expect(newsClient.filterNews).toHaveBeenCalledWith(
        'commentisfree',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('updates news data on filter', () => {
      newsClient.filterNews.mockImplementation((section, callback) => {
        callback(apiData);
      });
      newsModel.getNews = jest.fn().mockReturnValue([mockNews[0], mockNews[1]]);
      newsView.displayNewsBySection();

      expect(document.querySelectorAll('.news').length).toEqual(2);
      expect(document.querySelector('.news').textContent).toContain(
        'UK house price growth slows'
      );
    });

    it('calls displayError when error callback is triggered by filter', () => {
      jest.spyOn(newsView, 'displayError');
      newsView.newsClient.filterNews = jest.fn((_, __, errorCallback) => {
        errorCallback();
      });
      newsView.displayNewsBySection('section');
      expect(newsView.displayError).toHaveBeenCalledWith(
        'Oops - API appears to be down!'
      );
    });
  });

  describe('displayErrors', () => {
    it('should display an error when displayError is triggered', () => {
      newsView.displayError('Oops! Looks like something went wrong...');
      const errorElement = document.querySelector('h2.error');
      expect(errorElement.textContent).toBe(
        'Oops! Looks like something went wrong...'
      );
    });
  });

  describe('eventListeners', () => {
    beforeEach(() => {
      document.body.innerHTML = fs.readFileSync('./index.html');
      document.dispatchEvent(new Event('DOMContentLoaded'));
      newsView.displayNewsFromApi = jest.fn();
      newsView.displayNewsBySection = jest.fn();
      newsView.displayNewsFromSearch = jest.fn();
    });

    it('calls displayNewsFromApi on DOMContentLoaded', () => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
      expect(newsView.displayNewsFromApi).toHaveBeenCalled();
    });

    it('allows user to submit a search using the searchbar', () => {
      const searchForm = document.querySelector('.searchbar');
      const searchInput = document.querySelector('#search-input');
      searchInput.value = 'sport';
      searchForm.submit();
      expect(newsView.displayNewsFromSearch).toHaveBeenCalledWith('sport');
    });
    test('Header logo is clicked', () => {
      document.querySelector('#header-button-logo').click();
      expect(newsView.displayNewsFromApi).toHaveBeenCalled();
    });

    test('UK headlines section is clicked', () => {
      document.querySelector('#header-button-uk').click();
      expect(newsView.displayNewsBySection).toHaveBeenCalledWith('uk-news');
    });
    test('Business section is clicked', () => {
      document.querySelector('#header-button-business').click();
      expect(newsView.displayNewsBySection).toHaveBeenCalledWith('business');
    });
    test('Politics section is clicked', () => {
      document.querySelector('#header-button-politics').click();
      expect(newsView.displayNewsBySection).toHaveBeenCalledWith('politics');
    });

    test('Opinion section is clicked', () => {
      document.querySelector('#header-button-opinion').click();
      expect(newsView.displayNewsBySection).toHaveBeenCalledWith(
        'commentisfree'
      );
    });

    test('Sport section is clicked', () => {
      document.querySelector('#header-button-sport').click();
      expect(newsView.displayNewsBySection).toHaveBeenCalledWith('sport');
    });

    test('Culture section is clicked', () => {
      document.querySelector('#header-button-culture').click();
      expect(newsView.displayNewsBySection).toHaveBeenCalledWith('culture');
    });
  });
});
