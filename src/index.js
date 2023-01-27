import './css/styles.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import PicturesAPI from './fetch-pics';

const refs = {
  formEl: document.querySelector('.search-form'),
  inputEl: document.querySelector('.search-form__input'),
  galleryContainer: document.querySelector('.gallery'),
  guard: document.querySelector('.guard'),
};

refs.formEl.addEventListener('submit', onFormSubmit);

function onFormSubmit(event) {
  event.preventDefault();
  searchPics();
}

const picsSerchAPI = new PicturesAPI();

function searchPics() {
  if (!refs.inputEl.value) {
    Notify.warning('Please type something.');
    return;
  }
  picsSerchAPI.query = refs.inputEl.value.trim();
  observer.observe(refs.guard);
  picsSerchAPI.resetPage();
  clearMarkup();

  picsSerchAPI
    .fetchPictures(picsSerchAPI.query)
    .then(data => {
      if (!data.hits.length) {
        Notify.failure(
          'Sorry, there are no images matching your search. Please try again.'
        );
        return;
      }
      makePicsMarkup(data);
      const totalResults = data.totalHits;
      Notify.success(`Hooray! We found ${totalResults} images.`);
    })
    .catch(onFetchError);
}

function onFetchError() {
  error => {
    Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
    console.log(error);
  };
}

function makePicsMarkup(data) {
  refs.galleryContainer.insertAdjacentHTML(
    'beforeend',
    makeImageMarkup(data.hits)
  );
  lightbox.refresh();
  /*   scrollSmooth(); */
}

function clearMarkup() {
  refs.galleryContainer.innerHTML = '';
}

let lightbox = new SimpleLightbox('.gallery div', {
  captionDelay: 250,
  captionSelector: 'img',
  captionsData: 'alt',
});

const observer = new IntersectionObserver(onEntry, {
  rootMargin: '200px',
});

function onEntry(entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      picsSerchAPI.icrementPage();
      picsSerchAPI
        .fetchPictures()
        .then(data => {
          makePicsMarkup(data);
          lightbox.refresh();
          if (
            data.totalHits === refs.galleryContainer.children.length ||
            data.totalHits < refs.galleryContainer.children.length
          ) {
            Notify.failure(
              `We're sorry, but you've reached the end of search results.`
            );
            observer.unobserve(refs.guard);
          }
        })
        .catch(error => console.log(error));
    }
  });
}

function makeImageMarkup(image) {
  return image
    .map(
      ({
        largeImageURL,
        webformatURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<div class="photo-card gallery__item">
<a rel="nofollow, noreferrer" href="${largeImageURL}"><img class="gallery__image" src="${webformatURL}" 
alt="${tags}" loading="lazy" title="Click to enlarge" width="290px" height="190px"/></a>
  <div class="gallery__descr">
    <p class="gallery__features">
      <span class="gallery__values">Likes: </span><span>${likes}</span>
    </p>
    <p class="gallery__features">
      <span class="gallery__values">Views: </span><span>${views}</span>
    </p>
    <p class="gallery__features">
      <span class="gallery__values">Comments: </span><span>${comments}</span>
    </p>
    <p class="gallery__features">
      <span class="gallery__values">Downloads: </span><span>${downloads}</span>
    </p>
  </div>
</div>`;
      }
    )
    .join('');
}

/* function scrollSmooth() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
  console.log("scrolling")
} */
