import { useEffect } from 'react';

// Per-page SEO for the single-page app. Sets the document title and the tags a
// search engine and a link preview read, then restores them when the page
// unmounts, so client-side navigation never leaves a stale title behind. No
// dependency and no server rendering needed.

const SITE = 'https://firasa.agrimverma.dev';

function upsertMeta(attr, key, content) {
  if (!content) return null;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  let created = false;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute('content');
  el.setAttribute('content', content);
  return () => {
    if (created) el.remove();
    else if (prev != null) el.setAttribute('content', prev);
  };
}

function upsertCanonical(href) {
  if (!href) return null;
  let el = document.head.querySelector('link[rel="canonical"]');
  let created = false;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
    created = true;
  }
  const prev = el.getAttribute('href');
  el.setAttribute('href', href);
  return () => {
    if (created) el.remove();
    else if (prev != null) el.setAttribute('href', prev);
  };
}

function injectJsonLd(data) {
  if (!data) return null;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
  return () => script.remove();
}

export function usePageMeta({ title, description, path, image, jsonLd, noindex }) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;
    const url = path ? `${SITE}${path}` : undefined;
    const ogImage = image ? `${SITE}${image}` : undefined;
    const cleanups = [
      upsertMeta('name', 'robots', noindex ? 'noindex, follow' : null),
      upsertMeta('name', 'description', description),
      upsertMeta('property', 'og:type', 'website'),
      upsertMeta('property', 'og:title', title),
      upsertMeta('property', 'og:description', description),
      upsertMeta('property', 'og:url', url),
      upsertMeta('property', 'og:image', ogImage),
      upsertMeta('name', 'twitter:card', 'summary_large_image'),
      upsertMeta('name', 'twitter:title', title),
      upsertMeta('name', 'twitter:description', description),
      upsertCanonical(url),
      injectJsonLd(jsonLd),
    ];
    return () => {
      document.title = prevTitle;
      cleanups.forEach((fn) => fn && fn());
    };
  }, [title, description, path, image, jsonLd, noindex]);
}
