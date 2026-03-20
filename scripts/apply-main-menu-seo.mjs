import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve('public/clone');

const BASE_TARGETS = new Map([
  ['/', homeContent()],
  ['/browse/ceiling-fittings', categoryContent({
    metaTitle: 'Ceiling Fittings for Luxury Lighting | Designer Lighting | Best & Brown',
    description: 'Discover ceiling fittings that support luxury lighting, designer lighting, quality lighting and beautiful lighting in every room.',
    h1: 'Ceiling fittings for luxury lighting',
    eyebrow: 'Ceiling fittings',
    title: 'Ceiling fittings for a considered luxury lighting scheme',
    sectionTitle: 'Ceiling fitting ideas',
    intro: [
      'Ceiling fittings set the base light level in a room, so they usually do the heaviest work in the scheme. The best choices feel calm in the architecture and still bring enough character to the room.',
      'For luxury designer lighting, look for pendants, chandeliers, flush fittings and recessed options that suit the room height, the furniture layout and the mood you want to create.'
    ],
    cards: [
      {
        title: 'Statement pendants',
        body: 'Use a pendant or chandelier when the ceiling height allows the fitting to become part of the room composition.',
        points: ['Dining areas and stair voids.', 'Rooms that need a clear focal point.', 'Spaces that can handle a stronger silhouette.']
      },
      {
        title: 'Flush and surface fittings',
        body: 'These are the practical answer when the room needs a clean ceiling line and a more restrained profile.',
        points: ['Hallways and landings.', 'Lower ceilings and renovations.', 'Rooms that need even light with little visual bulk.']
      },
      {
        title: 'Recessed plans',
        body: 'A good recessed plan keeps the ceiling quiet and lets other materials do the work.',
        points: ['Use spots sparingly.', 'Mix with decorative fittings where it helps the room.', 'Avoid flattening the space with too much light.']
      }
    ],
    links: [
      ['/browse/wall-lamps', 'Wall lamps'],
      ['/browse/floor-lamps', 'Floor lamps'],
      ['/browse/table-lamps', 'Table lamps']
    ],
    note: 'The ceiling category is the natural starting point for a room-by-room lighting plan.'
  })],
  ['/browse/exterior-lighting', exteriorContent()],
  ['/browse/floor-lamps', floorContent()],
  ['/browse/table-lamps', tableContent()],
  ['/browse/wall-lamps', wallContent()],
  ['/browse/bathroom', bathroomContent()],
  ['/browse/lamps-and-bulbs', bulbsContent()],
  ['/brands', brandsContent()],
]);

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.mirror') continue;
      await walk(full, files);
      continue;
    }
    if (/\.html?$/i.test(entry.name) || !path.extname(entry.name)) files.push(full);
  }
  return files;
}

function stripOld(html) {
  return html
    .replace(/\n?\s*<div id="search-box">\s*<div>\s*<autocomplete \/>[\s\S]*?<\/div>\s*<\/div>/g, '')
    .replace(/\n?\s*<div class="account ">\s*<ul class="account-links">[\s\S]*?<\/ul>\s*<\/div>/g, '')
    .replace(/\n?<!-- Google Tag Manager Data Layer START-->[\s\S]*?<!-- Google Tag Manager Data Layer END -->/g, '')
    .replace(/\n?<!-- Google Tag Manager Container START -->[\s\S]*?<!-- Google Tag Manager Container END -->/g, '')
    .replace(/\n?<!-- Applications Insights START -->[\s\S]*?<!-- Applications Insights END -->/g, '')
    .replace(/\n?\s*<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/g, '')
    .replace(/\n?\s*<link rel="stylesheet" href="\/assets\/seo-layer\.css" \/>/g, '')
    .replace(/\n?\s*<script defer src="\/assets\/seo-layer\.js"><\/script>/g, '')
    .replace(/\n?\s*<script type="text\/javascript" src="\/dist\/vue-app\.js"><\/script>/g, '')
    .replace(/\n?\s*<section class="seo-layer">[\s\S]*?<\/section>/g, '')
    .replace(/\n?\s*<link rel="stylesheet" href="\/assets\/main-menu-seo\.css" \/>/g, '')
    .replace(/\n?\s*<section class="main-menu-seo[^"]*">[\s\S]*?<\/section>/g, '')
    .replace(/\n?\s*<section class="home-category-hub">[\s\S]*?<\/section>/g, '')
    .replace(/\n?\s*<div id="header-breadcrumbs-container">[\s\S]*?<\/div>\s*(?=\n+\s*(?:<!-- CONTENT -->|<main>))/g, '')
    .replace(/(<a href="\/" id="logo" title="Best &amp; Brown"><\/a>)\s*<\/div>\s*(?=\n\n<div id="project-summary">)/g, '$1');
}

function injectCss(html) {
  if (html.includes('/assets/main-menu-seo.css')) return html;
  return html.replace('</head>', '  <link rel="stylesheet" href="/assets/main-menu-seo.css" />\n</head>');
}

function injectGoogleTag(html) {
  if (html.includes('G-GL2PN7CK68')) return html;
  const googleTag = `  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-GL2PN7CK68"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-GL2PN7CK68');
  </script>
`;
  return html.replace('</head>', `${googleTag}</head>`);
}

function updateFooterLegal(html) {
  return html
    .replace(
      /Best &amp; Brown is a trading name of LightingEnterprises\.com Ltd/g,
      'Best &amp; Brown is a trading name of Lighting Design Online Ltd'
    )
    .replace(
      /Best & Brown is a trading name of LightingEnterprises\.com Ltd/g,
      'Best & Brown is a trading name of Lighting Design Online Ltd'
    )
    .replace(
      /LightingEnterprises\.com/g,
      'Lighting Design Online'
    )
    .replace(
      /lightingenterprises\.com/g,
      'lightingdesignonline.com'
    );
}

function updateRegisteredAddress(html) {
  const addressBlock = [
    'Unit 316, Moat House Business Centre',
    '54 Bloomfield Avenue',
    'Belfast',
    'BT5 5AD'
  ];

  html = html
    .replace(
      /The Engine Room, Portview Trade Centre,<br \/>[\r\n\s]*310 Newtownards Road,<br \/>[\r\n\s]*Belfast,<br \/>[\r\n\s]*BT4 1HE\.<br \/>[\r\n\s]*United Kingdom\.<br \/><br \/>/g,
      `${addressBlock[0]},<br />\n            ${addressBlock[1]},<br />\n            ${addressBlock[2]},<br />\n            ${addressBlock[3]}.<br /><br />`
    )
    .replace(
      /The Engine Room, Portview,<br>310 Newtownards Road,<br>Belfast,<br>BT4 1HE,<br>N\. Ireland\./g,
      `${addressBlock[0]}<br>${addressBlock[1]}<br>${addressBlock[2]}<br>${addressBlock[3]}`
    )
    .replace(
      /The Engine Room, Portview,<br \/>310 Newtownards Road,<br \/>Belfast,<br \/>BT4 1HE,<br \/>N\. Ireland\./g,
      `${addressBlock[0]}<br />${addressBlock[1]}<br />${addressBlock[2]}<br />${addressBlock[3]}`
    );

  return html;
}

function updateAttachments(html) {
  const attachmentIds = ['32033', '24601', '25573', '23786', '23787', '23264', '23263', '33518'];
  for (const id of attachmentIds) {
    const remote = `https://lightbasestorage.blob.core.windows.net/rel-att/${id}.pdf`;
    const local = `/content/rel-att/${id}.pdf`;
    html = html.split(remote).join(local);
  }
  return html;
}

function updateFooterLayout(html) {
  html = html
    .replace(
      /\n?\s*<li class="live-chat"><a onclick="\$zoho\.salesiq\.floatwindow\.visible\('show'\);" href="#">Live chat<\/a><\/li>/g,
      ''
    )
    .replace(
      /\n?\s*<div id="footer-mailing-list-signup">[\s\S]*?\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<div id="footer-copyright">/g,
      '\n  <div id="footer-copyright">'
    )
    .replace(
      /\n?\s*<div id="footer-mailing-list-signup">[\s\S]*?\n\s*<\/div>\s*\n\s*<div id="footer-copyright">/g,
      '\n  <div id="footer-copyright">'
    )
    .replace(
      /\n?\s*<div id="footer-mailing-list-signup">[\s\S]*?\n\s*<\/div>\s*<\/div>\s*<div id="footer-copyright">/g,
      ''
    );

  html = html.replace(
    /<div id="footer-inner">[\s\S]*?<div id="footer-about-us-links">([\s\S]*?)<\/div>\s*<\/div>\s*<div id="footer-copyright">\s*<ul class="social">([\s\S]*?)<\/ul>\s*<p>Copyright \(c\) Best &amp; Brown 2026 - All rights reserved - Designer & Luxury Lighting Specialists<\/p>\s*<p>Best &amp; Brown is a trading name of Lighting Design Online Ltd<\/p>\s*<\/div>\s*<\/footer>/g,
    `<div id="footer-inner">
    <div id="footer-contact-us">
      <h4>Contact us</h4>
      <ul class="methods">
        <li class="email"><a href="mailto:sales@bestandbrown.com"><span class="method-name">Email: </span>sales@bestandbrown.com</a></li>
        <li class="phone"><a href="tel:+442033975253"><span class="method-name">Phone: </span>+44 (0)203 397 52 53</a></li>
        <li class="opening-hours">Customer Support Hours<br/><table><tr><td>Mon-Thur:</td><td>09:00 - 17:00</td></tr><tr><td>Fri:</td><td>09:00 - 15:00</td></tr></table></li>
      </ul>
    </div>
    <div id="footer-help-links">
      <h4>Customer Support</h4>
      <ul>
        <li><a href="/info/help/price-guarantee">7 Day Price Match Guarantee</a></li>
        <li><a href="/info/help/delivery">Delivery</a></li>
        <li><a href="/info/help/terms-and-conditions" class="footer-terms-link">Terms &amp; Conditions</a></li>
        <li><a href="/info/help/privacy-policy">Privacy Policy</a></li>
      </ul>
    </div>
    <div id="footer-about-us-links">
      <h4>Learn More</h4>
      <ul>
        <li><a href="/account/register">Trade Customers</a></li>
        <li><a href="/info/help/overview">About Us</a></li>
        <li><a href="/info/help/contact" class="footer-contact-link">Contact Us</a></li>
      </ul>
    </div>
    <div id="footer-connect-with-us">
      <h4>Connect with us</h4>
      <ul class="social">
        $2
      </ul>
    </div>
  </div>
  <div id="footer-copyright">
    <p>Copyright (c) Best &amp; Brown 2026 - All rights reserved - Designer &amp; Luxury Lighting Specialists</p>
    <p>Best &amp; Brown is a trading name of Lighting Design Online Ltd</p>
  </div>
</footer>`
  );

  return html;
}

function setHeadTags(html, { title, description }) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  if (description) {
    if (/<meta name="description" content="[^"]*"\s*\/>/.test(html)) {
      html = html.replace(
        /<meta name="description" content="[^"]*"\s*\/>/,
        `<meta name="description" content="${description}" />`
      );
    } else {
      html = html.replace(
        /(<title>[\s\S]*?<\/title>)/,
        `$1\n  <meta name="description" content="${description}" />`
      );
    }
  }
  return html;
}

function categoryContent(data) {
  return {
    metaTitle: data.metaTitle,
    description: data.description,
    h1: data.h1,
    eyebrow: data.eyebrow,
    title: data.title,
    intro: data.intro,
    cards: data.cards,
    links: data.links,
    note: data.note
  };
}

function pageBlock(data) {
  return `
    <section class="main-menu-seo">
      <div class="main-menu-seo__panel">
        <p class="main-menu-seo__eyebrow">${data.eyebrow}</p>
        <h1 class="main-menu-seo__title">${data.h1 || data.title}</h1>
        ${data.intro.map((p) => `<p class="main-menu-seo__intro">${p}</p>`).join('\n        ')}
        <h2 class="main-menu-seo__section-title">${data.sectionTitle || 'Explore the details'}</h2>
        <div class="main-menu-seo__grid">
          ${data.cards.map((card) => `
          <article class="main-menu-seo__card">
            <h2>${card.title}</h2>
            <p>${card.body}</p>
            <ul class="main-menu-seo__list">
              ${card.points.map((point) => `<li>${point}</li>`).join('\n              ')}
            </ul>
          </article>`).join('\n          ')}
        </div>
        <div class="main-menu-seo__links">
          ${data.links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n          ')}
        </div>
      </div>
    </section>`;
}

function homeContent() {
  return {
    metaTitle: 'Luxury Lighting by Category | Designer Lighting | Best & Brown',
    description: 'Explore luxury lighting, designer lighting, quality lighting and beautiful lighting across the main room categories at Best & Brown.',
    h1: 'Luxury designer lighting for every room',
    eyebrow: 'Luxury designer lighting',
    title: 'A cleaner homepage that routes straight to the main categories',
    sectionTitle: 'Shop by category',
    intro: [
      'The homepage now works as a compact entry point into the category pages people actually use. That keeps the site easier to scan and more useful for search intent around room-by-room lighting.',
      'Each card below links directly into a core category so visitors can move from the homepage into the right section without extra friction.'
    ],
    cards: [
      {
        title: 'Ceiling fittings',
        body: 'Main-room lighting for dining spaces, hallways and living rooms.',
        image: '/images/600/127395.jpg?w=400&h=400&mode=crop',
        href: '/browse/ceiling-fittings'
      },
      {
        title: 'Exterior lighting',
        body: 'Architectural and garden lighting with a quieter, more composed feel.',
        image: '/images/600/55783.jpg?w=400&h=400&mode=crop',
        href: '/browse/exterior-lighting'
      },
      {
        title: 'Floor lamps',
        body: 'Tall statement pieces and practical reading lamps for softer layers.',
        image: '/images/600/164766.jpg?w=400&h=400&mode=crop',
        href: '/browse/floor-lamps'
      },
      {
        title: 'Table lamps',
        body: 'Low-level light for bedrooms, consoles and calm evening atmospheres.',
        image: '/images/600/127378.jpg?w=400&h=400&mode=crop',
        href: '/browse/table-lamps'
      },
      {
        title: 'Wall lamps',
        body: 'Useful for corridors, bedside reading and adding depth to a wall.',
        image: '/images/600/124475.jpg?w=350&h=350&mode=crop',
        href: '/browse/wall-lamps'
      },
      {
        title: 'Bathroom lighting',
        body: 'Mirror and ceiling lighting that stays practical without feeling cold.',
        image: '/images/600/124522.jpg?w=600&h=600&scale=both&quality=70&mode=pad&bgColor=ffffff',
        href: '/browse/bathroom'
      },
      {
        title: 'Lamps & bulbs',
        body: 'A useful route for final details, replacements and refinements.',
        image: '/images/600/127379.jpg?w=400&h=400&mode=crop',
        href: '/browse/lamps-and-bulbs'
      }
    ],
    links: [
      ['/browse/ceiling-fittings', 'Ceiling fittings'],
      ['/browse/exterior-lighting', 'Exterior lighting'],
      ['/browse/floor-lamps', 'Floor lamps'],
      ['/browse/table-lamps', 'Table lamps'],
      ['/browse/wall-lamps', 'Wall lamps'],
      ['/browse/bathroom', 'Bathroom lighting'],
      ['/browse/lamps-and-bulbs', 'Lamps & bulbs']
    ],
    note: 'The homepage stays close to the existing site style while acting more clearly as a navigation hub.'
  };
}

function homeHubBlock(data) {
  return `
    <section class="home-category-hub">
      <div class="home-category-hub__banner" role="note" aria-label="Site announcement">
        <span class="home-category-hub__banner-kicker">Announcement</span>
        <strong>New site coming soon</strong>
      </div>
      <div class="home-category-hub__intro">
        <p class="home-category-hub__eyebrow">${data.eyebrow}</p>
        <h1 class="home-category-hub__title">${data.h1 || data.title}</h1>
        ${data.intro.map((p) => `<p class="home-category-hub__intro-text">${p}</p>`).join('\n        ')}
        <h2 class="home-category-hub__section-title">${data.sectionTitle}</h2>
      </div>
      <div class="home-category-hub__grid">
        ${data.cards.map((card) => `
        <a class="home-category-card" href="${card.href}">
          <img src="${card.image}" alt="${card.title}" />
          <span class="home-category-card__label">${card.title}</span>
          <span class="home-category-card__copy">${card.body}</span>
        </a>`).join('\n        ')}
      </div>
      <div class="home-category-hub__links">
        ${data.links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n        ')}
      </div>
    </section>`;
}

function brandsBlock(data) {
  return `
    <section class="main-menu-seo main-menu-seo--brands">
      <div class="main-menu-seo__panel">
        <p class="main-menu-seo__eyebrow">${data.eyebrow}</p>
        <h2 class="main-menu-seo__title">${data.title}</h2>
        ${data.intro.map((p) => `<p class="main-menu-seo__intro">${p}</p>`).join('\n        ')}
        <h2 class="main-menu-seo__section-title">${data.sectionTitle}</h2>
        <div class="main-menu-seo__grid">
          ${data.cards.map((card) => `
          <article class="main-menu-seo__card">
            <h2>${card.title}</h2>
            <p>${card.body}</p>
            <ul class="main-menu-seo__list">
              ${card.points.map((point) => `<li>${point}</li>`).join('\n              ')}
            </ul>
          </article>`).join('\n          ')}
        </div>
        <div class="main-menu-seo__links">
          ${data.links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n          ')}
        </div>
      </div>
    </section>`;
}

function cleanLabel(label) {
  return label
    .replace(/&amp;/g, '&')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/\s*\/\s*/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleLabel(label) {
  return cleanLabel(label)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

function categoryLabelFor(route) {
  if (route === '/browse/ceiling-fittings') return 'Ceiling fittings';
  if (route === '/browse/exterior-lighting') return 'Exterior lighting';
  if (route === '/browse/floor-lamps') return 'Floor lamps';
  if (route === '/browse/table-lamps') return 'Table lamps';
  if (route === '/browse/wall-lamps') return 'Wall lamps';
  if (route === '/browse/bathroom') return 'Bathroom lighting';
  if (route === '/browse/lamps-and-bulbs') return 'Lamps and bulbs';
  return 'Lighting';
}

function extractSubmenuLinks(html) {
  const start = html.indexOf('<div id="menu-dropdown">');
  const end = html.indexOf('<input type="hidden" id="input-hidden-header-bab" />');
  if (start === -1 || end === -1 || end <= start) return [];
  const section = html.slice(start, end);
  const matches = [...section.matchAll(/<a href="([^"]+\?[^"]+)">([^<]+)<\/a>/g)];
  const seen = new Set();
  const links = [];

  for (const match of matches) {
    const href = match[1];
    const label = match[2].replace(/&amp;/g, '&').trim();
    if (seen.has(href)) continue;
    seen.add(href);
    links.push({ href, label });
  }

  return links;
}

function buildTargets(menuHtml) {
  const targets = new Map(BASE_TARGETS);
  for (const link of extractSubmenuLinks(menuHtml)) {
    const data = submenuContent(link.href, link.label);
    if (data) targets.set(link.href, data);
  }
  return targets;
}

function submenuContent(href, label) {
  const url = new URL(href, 'https://example.com');
  const baseRoute = url.pathname;
  const category = categoryLabelFor(baseRoute);
  const kind = url.searchParams.has('brands')
    ? 'brands'
    : url.searchParams.has('themes')
      ? 'themes'
      : url.searchParams.has('functions')
        ? 'functions'
        : null;
  if (!kind) return null;

  const displayLabel = titleLabel(label);
  const siblingLinks = {
    '/browse/ceiling-fittings': ['/browse/floor-lamps', '/browse/table-lamps', '/browse/wall-lamps'],
    '/browse/exterior-lighting': ['/browse/wall-lamps', '/browse/ceiling-fittings', '/browse/bathroom'],
    '/browse/floor-lamps': ['/browse/table-lamps', '/browse/wall-lamps', '/browse/ceiling-fittings'],
    '/browse/table-lamps': ['/browse/floor-lamps', '/browse/wall-lamps', '/browse/ceiling-fittings'],
    '/browse/wall-lamps': ['/browse/ceiling-fittings', '/browse/floor-lamps', '/browse/table-lamps'],
    '/browse/bathroom': ['/browse/ceiling-fittings', '/browse/wall-lamps', '/browse/lamps-and-bulbs'],
  }[baseRoute] || ['/browse/ceiling-fittings', '/browse/wall-lamps', '/browse/floor-lamps'];

  if (kind === 'functions') {
    return {
      metaTitle: `${displayLabel} for Luxury Designer Lighting | Best & Brown`,
      description: `Explore ${displayLabel.toLowerCase()} for luxury lighting, designer lighting, quality lighting and beautiful lighting within ${category.toLowerCase()}.`,
      h1: `${displayLabel} for luxury lighting`,
      eyebrow: category,
      title: `${displayLabel} for ${category.toLowerCase()}`,
      sectionTitle: `Why ${displayLabel.toLowerCase()} work`,
      intro: [
        `${displayLabel} narrow the ${category.toLowerCase()} collection to a specific lighting role, which is useful when the room already has a clear layout.`,
        `Use this page to compare scale, finish and placement before you move back to the wider ${category.toLowerCase()} range.`
      ],
      cards: [
        {
          title: 'Where it works',
          body: `The ${displayLabel.toLowerCase()} route is strongest when the fitting has a clear job in the room.`,
          points: [
            'Choose it where the light needs a defined role.',
            'Use it to simplify a wider category.',
            'Keep the room plan clean and legible.'
          ]
        },
        {
          title: 'What to compare',
          body: 'The difference between good options is usually in proportion, beam direction and how quietly they sit in the architecture.',
          points: [
            'Check how much visual weight the fitting adds.',
            'Look at the beam spread and glare control.',
            'Match the finish to the rest of the scheme.'
          ]
        },
        {
          title: 'Good next steps',
          body: 'Once the function is clear, compare the category against nearby room layers for a more complete result.',
          points: siblingLinks.map((href) => categoryLabelFor(href)),
        }
      ],
      links: [
        [baseRoute, `All ${category}`],
        ...siblingLinks.map((href) => [href, categoryLabelFor(href)])
      ],
      note: `This page helps shoppers move from a broad ${category.toLowerCase()} collection into the exact fitting style they need.`
    };
  }

  if (kind === 'brands') {
    return {
      metaTitle: `${displayLabel} lighting in ${category} | Designer Lighting | Best & Brown`,
      description: `Compare ${displayLabel.toLowerCase()} against the wider ${category.toLowerCase()} range to find luxury lighting, designer lighting, quality lighting and beautiful lighting.`,
      h1: `${displayLabel} lighting in ${category}`,
      eyebrow: `${category} brand focus`,
      title: `${displayLabel} lighting in ${category.toLowerCase()}`,
      sectionTitle: `Why ${displayLabel.toLowerCase()} suits this category`,
      intro: [
        `${displayLabel} is a useful brand route when you already trust the maker and want to compare its work inside ${category.toLowerCase()}.`,
        `This page helps keep the shortlist tight by showing how the brand sits within the wider room category.`
      ],
      cards: [
        {
          title: 'Brand character',
          body: `Look for the finishes, silhouette and detailing that make ${displayLabel} recognisable across the range.`,
          points: [
            'Compare the shapes, not just the product names.',
            'Check whether the finish feels quiet or expressive.',
            'Make sure the brand fits the room scale.'
          ]
        },
        {
          title: 'How to compare',
          body: 'The best shortlist usually comes from comparing the same maker across several fitting types.',
          points: [
            'Move between ceiling, wall and portable pieces.',
            'Check whether the family feels coherent.',
            'Keep the design language consistent indoors and out.'
          ]
        },
        {
          title: 'Useful next clicks',
          body: 'Use the category page and the nearby room layers to build a more complete specification.',
          points: siblingLinks.map((href) => categoryLabelFor(href))
        }
      ],
      links: [
        [baseRoute, `All ${category}`],
        ...siblingLinks.map((href) => [href, categoryLabelFor(href)])
      ],
      note: `${displayLabel} works best here as a shortcut to a more coherent project shortlist.`
    };
  }

  return {
    metaTitle: `${displayLabel} lighting ideas | Luxury Lighting | Best & Brown`,
    description: `Use ${displayLabel.toLowerCase()} to shape luxury lighting, designer lighting, quality lighting and beautiful lighting within ${category.toLowerCase()}.`,
    h1: `${displayLabel} lighting for designer interiors`,
    eyebrow: `${category} mood`,
    title: `${displayLabel} ideas for ${category.toLowerCase()}`,
    sectionTitle: `Why this mood works`,
    intro: [
      `${displayLabel} is a useful shorthand for a particular mood inside ${category.toLowerCase()}.`,
      `Use it when you want the lighting to sit neatly inside a wider interior direction rather than behaving as a standalone object.`
    ],
    cards: [
      {
        title: 'How the theme reads',
        body: `The ${displayLabel.toLowerCase()} filter points toward a more specific look and feel, which can help narrow a large category quickly.`,
        points: [
          'Use it to refine the atmosphere.',
          'Keep the surrounding furniture language coherent.',
          'Avoid mixing too many conflicting finishes.'
        ]
      },
      {
        title: 'Best finishes',
        body: 'Theme pages work best when the metal, glass or painted surfaces support the mood rather than competing with it.',
        points: [
          'Repeat the same core finish in the room.',
          'Keep contrast deliberate rather than busy.',
          'Let the texture support the mood.'
        ]
      },
      {
        title: 'Where it feels strongest',
        body: 'A theme is most effective when it ties the fitting to the wider scheme of the home.',
        points: siblingLinks.map((href) => categoryLabelFor(href))
      }
    ],
    links: [
      [baseRoute, `All ${category}`],
      ...siblingLinks.map((href) => [href, categoryLabelFor(href)])
    ],
    note: `This filter is a quick way to move from browsing to a more focused lighting direction.`
  };
}

function exteriorContent() {
  return {
    metaTitle: 'Exterior Lighting for Luxury Lighting | Designer Lighting | Best & Brown',
    description: 'Explore exterior lighting ideas for luxury lighting, designer lighting, quality lighting and beautiful lighting around architecture, paths and terraces.',
    h1: 'Exterior lighting for luxury lighting schemes',
    eyebrow: 'Exterior lighting',
    title: 'Exterior lighting for architecture, paths and terrace schemes',
    sectionTitle: 'Key exterior lighting ideas',
    intro: [
      'Exterior lighting should feel just as deliberate as the interior. The strongest schemes support movement, highlight structure and keep the building easy to read after dark.',
      'A luxury designer lighting approach is usually calmer outside: wall lights, bollards, step lights and discreet fittings do the work without flooding the garden.'
    ],
    cards: [
      {
        title: 'Arrival and circulation',
        body: 'Start with the routes so the space remains comfortable and safe to use at night.',
        points: ['Front doors and entry points.', 'Steps, paths and changes in level.', 'Terraces and seating areas.']
      },
      {
        title: 'Architectural continuity',
        body: 'Repeat the same finish language that appears inside the home.',
        points: ['Keep brass, bronze or black consistent.', 'Choose fittings that sit quietly in daylight.', 'Let the building stay the focus.']
      },
      {
        title: 'Mood after dark',
        body: 'The aim is low-glare light that adds atmosphere without overpowering the landscape.',
        points: ['Keep light sources discreet.', 'Avoid over-lighting walls and planting.', 'Use decorative pieces sparingly.']
      }
    ],
    links: [
      ['/browse/wall-lamps', 'Wall lamps'],
      ['/browse/ceiling-fittings', 'Ceiling fittings'],
      ['/browse/bathroom', 'Bathroom lighting']
    ],
    note: 'Exterior lighting is strongest when it extends the interior design language rather than competing with it.'
  };
}

function floorContent() {
  return {
    metaTitle: 'Floor Lamps for Luxury Lighting | Designer Lighting | Best & Brown',
    description: 'Find floor lamps that add luxury lighting, designer lighting, quality lighting and beautiful lighting to reading corners and living spaces.',
    h1: 'Floor lamps for luxury lighting',
    eyebrow: 'Floor lamps',
    title: 'Floor lamps that add scale and atmosphere to luxury interiors',
    sectionTitle: 'What to compare in floor lamps',
    intro: [
      'Floor lamps are one of the easiest ways to add height, warmth and a softer evening layer. They can finish a room without needing a new ceiling fixture.',
      'In a luxury designer lighting scheme, a floor lamp should read as a deliberate object: balanced, sculptural and useful beside a sofa or reading chair.'
    ],
    cards: [
      {
        title: 'Reading light',
        body: 'An adjustable lamp is ideal where the room needs task light beside a seat.',
        points: ['A focused head improves comfort.', 'Dimming keeps the room flexible.', 'Place it where cables stay discreet.']
      },
      {
        title: 'Sculptural form',
        body: 'A tall, elegant profile helps break up large spaces and adds movement to the room.',
        points: ['Use it in a corner or beside a console.', 'Match the finish to nearby furniture.', 'Let it contribute to the silhouette.']
      },
      {
        title: 'Layering the plan',
        body: 'Floor lamps work best when they sit alongside wall and table lamps rather than replacing them.',
        points: ['Mix low and mid-level light.', 'Keep the ceiling layer calm if needed.', 'Use lamps to soften the edges of the plan.']
      }
    ],
    links: [
      ['/browse/table-lamps', 'Table lamps'],
      ['/browse/wall-lamps', 'Wall lamps'],
      ['/browse/ceiling-fittings', 'Ceiling fittings']
    ],
    note: 'This category works well for search users comparing statement lamps and practical reading pieces.'
  };
}

function tableContent() {
  return {
    metaTitle: 'Table Lamps for Luxury Lighting | Designer Lighting | Best & Brown',
    description: 'Browse table lamps designed for luxury lighting, designer lighting, quality lighting and beautiful lighting in bedrooms, living rooms and hallways.',
    h1: 'Table lamps for luxury lighting',
    eyebrow: 'Table lamps',
    title: 'Table lamps for low-level luxury designer lighting',
    sectionTitle: 'How to choose table lamps',
    intro: [
      'Table lamps are the quickest way to make a room feel layered. They add low ambient light where people actually sit, read and relax.',
      'Use them on bedside tables, sideboards and consoles to create a calmer evening mood and a more complete composition.'
    ],
    cards: [
      {
        title: 'Bedside and reading use',
        body: 'A table lamp can replace harsh overhead light with something much softer.',
        points: ['Keep the shade proportional to the table.', 'Choose dimmable bulbs where possible.', 'Use matching pairs or intentional contrast.']
      },
      {
        title: 'Console styling',
        body: 'Placed carefully, a lamp can anchor the furniture beneath it and create a stronger visual point.',
        points: ['Works well on sideboards and shelving.', 'Can balance artwork or mirrors.', 'Adds warmth to long, low furniture.']
      },
      {
        title: 'Material finish',
        body: 'In luxury lighting, the shade and base matter as much as the shape.',
        points: ['Use opal glass, linen or metal carefully.', 'Repeat finishes used elsewhere in the room.', 'Keep the silhouette clean and composed.']
      }
    ],
    links: [
      ['/browse/floor-lamps', 'Floor lamps'],
      ['/browse/wall-lamps', 'Wall lamps'],
      ['/browse/ceiling-fittings', 'Ceiling fittings']
    ],
    note: 'Table lamps are an important finishing layer for bedrooms, living rooms and study spaces.'
  };
}

function wallContent() {
  return {
    metaTitle: 'Wall Lamps for Luxury Lighting | Designer Lighting | Best & Brown',
    description: 'Explore wall lamps for luxury lighting, designer lighting, quality lighting and beautiful lighting in corridors, bedrooms and living rooms.',
    h1: 'Wall lamps for luxury lighting',
    eyebrow: 'Wall lamps',
    title: 'Wall lamps that bring depth and detail to luxury lighting schemes',
    sectionTitle: 'How wall lamps shape the room',
    intro: [
      'Wall lamps are useful where ceiling light feels too direct or where the room needs more softness around the edges. They are especially effective in bedrooms, corridors and living rooms with artwork.',
      'A well-chosen wall fitting can make the architecture feel more tailored and the room more considered.'
    ],
    cards: [
      {
        title: 'Atmosphere and wall washing',
        body: 'Some wall lights work best by spreading light across the wall surface rather than projecting it into the room.',
        points: ['Good for corridors and stair landings.', 'Helps soften blank walls.', 'Adds depth without taking floor space.']
      },
      {
        title: 'Task and reading light',
        body: 'Directional fittings are ideal beside beds, desks and seating areas.',
        points: ['Choose adjustable arms where needed.', 'Keep the glare under control.', 'Place fittings at a practical height.']
      },
      {
        title: 'Art and mirror lighting',
        body: 'Wall lamps can frame artwork and mirrors while keeping the room balanced.',
        points: ['Use them to mark focal points.', 'Keep the beam clean and precise.', 'Avoid overcrowding the wall.']
      }
    ],
    links: [
      ['/browse/ceiling-fittings', 'Ceiling fittings'],
      ['/browse/floor-lamps', 'Floor lamps'],
      ['/browse/table-lamps', 'Table lamps']
    ],
    note: 'Wall lights are one of the most useful ways to make a room feel refined without adding bulk.'
  };
}

function bathroomContent() {
  return {
    metaTitle: 'Bathroom Lighting for Luxury Lighting | Designer Lighting | Best & Brown',
    description: 'Shop bathroom lighting for luxury lighting, designer lighting, quality lighting and beautiful lighting with a calm, practical feel.',
    h1: 'Bathroom lighting for luxury lighting',
    eyebrow: 'Bathroom lighting',
    title: 'Bathroom lighting with a calm, practical luxury feel',
    sectionTitle: 'Bathroom lighting priorities',
    intro: [
      'Bathroom lighting has to do more than look good. It needs to support grooming, reflect the room clearly and sit comfortably with the other finishes in the space.',
      'The best bathroom schemes combine mirror light, ceiling light and a softer layer of wall or accent lighting so the room feels calm in the evening and crisp in the morning.'
    ],
    cards: [
      {
        title: 'Mirror lighting',
        body: 'This is the most important task layer in the room.',
        points: ['Keep the face well lit.', 'Avoid hard shadows.', 'Choose fittings that work with the mirror size.']
      },
      {
        title: 'General illumination',
        body: 'Ceiling fittings help the bathroom feel open and comfortable.',
        points: ['Use them to support the mirror lights.', 'Keep the beam spread even.', 'Avoid over-bright spots above the basin.']
      },
      {
        title: 'Finish and durability',
        body: 'The bathroom rewards careful detailing because everything sits close together.',
        points: ['Coordinate finishes with taps and ironmongery.', 'Choose fittings suited to the room conditions.', 'Keep the look neat and uncluttered.']
      }
    ],
    links: [
      ['/browse/ceiling-fittings', 'Ceiling fittings'],
      ['/browse/wall-lamps', 'Wall lamps'],
      ['/browse/table-lamps', 'Table lamps']
    ],
    note: 'Bathroom lighting benefits from a restrained approach that balances function, comfort and visual calm.'
  };
}

function bulbsContent() {
  return {
    metaTitle: 'Lamps and Bulbs for Luxury Lighting | Designer Lighting | Best & Brown',
    description: 'Choose lamps and bulbs that support luxury lighting, designer lighting, quality lighting and beautiful lighting in every room.',
    h1: 'Lamps and bulbs for luxury lighting',
    eyebrow: 'Lamps and bulbs',
    title: 'Lamps and bulbs that complete the lighting scheme',
    sectionTitle: 'Choosing the right bulb',
    intro: [
      'The right bulb changes the way a fitting feels, so it matters just as much as the shape of the lamp itself. Warmth, beam quality and dimming all shape the final result.',
      'This page turns the lamps-and-bulbs menu item into a useful destination for people refining an existing scheme or replacing the last pieces of a room.'
    ],
    cards: [
      {
        title: 'Warmth and comfort',
        body: 'A warmer colour temperature helps most residential spaces feel calmer after dark.',
        points: ['Choose softer tones for living rooms.', 'Avoid harsh light in bedrooms.', 'Keep the atmosphere consistent room to room.']
      },
      {
        title: 'Dimming and control',
        body: 'Good dimming lets you tune the room for task light or evening ambience.',
        points: ['Check compatibility with the fixture.', 'Use dimmers where the scheme needs flexibility.', 'Reduce glare and over-brightness.']
      },
      {
        title: 'Upgrade value',
        body: 'Bulbs are a practical way to improve an existing room without a full refit.',
        points: ['A simple change can improve mood.', 'Useful when you already like the fittings.', 'Helps older schemes feel more polished.']
      }
    ],
    links: [
      ['/browse/ceiling-fittings', 'Ceiling fittings'],
      ['/browse/wall-lamps', 'Wall lamps'],
      ['/browse/floor-lamps', 'Floor lamps']
    ],
    note: 'Even a strong fitting benefits from the right bulb, especially in rooms where the light stays on for long periods.'
  };
}

function brandsContent() {
  return {
    metaTitle: 'Luxury Lighting Brands for Designer Homes | Best & Brown',
    description: 'Compare luxury lighting brands, designer lighting collections, quality lighting families and beautiful lighting finishes in one place.',
    h1: 'Luxury lighting brands for design-led homes',
    eyebrow: 'Brands and manufacturers',
    title: 'Luxury lighting brands worth exploring',
    sectionTitle: 'How to compare lighting brands',
    intro: [
      'The brands page is the right place to compare the makers behind the fittings. It helps you build a shortlist around a finish language, a family of shapes or a consistent approach to quality.',
      'Use it to move from luxury lighting inspiration into a more deliberate designer lighting specification.'
    ],
    cards: [
      {
        title: 'Compare the family',
        body: 'Strong brands usually repeat a visual language across ceiling, wall and portable fittings.',
        points: ['Look for shared proportions.', 'Check how the finish translates between rooms.', 'Use one maker to keep the scheme coherent.']
      },
      {
        title: 'Check the details',
        body: 'Quality lighting is usually visible in the edge detail, material choice and the way the fitting sits in the room.',
        points: ['Review the silhouette in daylight.', 'Compare metal, glass and shade combinations.', 'Keep the fit with the architecture in mind.']
      },
      {
        title: 'Use brand pages well',
        body: 'Move from the brand hub into category pages to refine the shortlist for the actual room.',
        points: ['Start with the maker.', 'Move into the room category.', 'Finish with the most beautiful lighting option.']
      }
    ],
    links: [
      ['/browse/ceiling-fittings', 'Ceiling fittings'],
      ['/browse/wall-lamps', 'Wall lamps'],
      ['/browse/floor-lamps', 'Floor lamps']
    ],
    note: 'The brands page works best as a strategic shortcut to a more coherent project shortlist.'
  };
}

function routeFor(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  const route = rel.endsWith('.html') ? '/' + rel.slice(0, -5) : '/' + rel;
  return route;
}

async function main() {
  const allHtml = await walk(ROOT);
  const indexHtml = await readFile(path.join(ROOT, 'index.html'), 'utf8');
  const targets = buildTargets(indexHtml);

  for (const file of allHtml) {
    let html = await readFile(file, 'utf8');
    if (!/<!DOCTYPE html>/i.test(html)) continue;
    const original = html;
    html = stripOld(html);
    html = updateFooterLegal(html);
    html = updateRegisteredAddress(html);
    html = updateAttachments(html);
    html = updateFooterLayout(html);

    const route = routeFor(file);
    html = injectCss(html);
    html = injectGoogleTag(html);
    if (route && targets.has(route)) {
      const data = targets.get(route);
      html = setHeadTags(html, {
        title: data.metaTitle || data.title,
        description: data.description
      });
      if (route === '/') {
        html = html.replace(
          '<div id="home-feature-products">',
          `${homeHubBlock(targets.get('/'))}\n    <div id="home-feature-products">`
        );
      } else if (route === '/brands') {
        html = html.replace(
          /<h1 id="brand-h1">[\s\S]*?<\/h1>/,
          `<h1 id="brand-h1">${data.h1}</h1>`
        );
        html = html.replace(
          '<div id="brand-list-container">',
          `${brandsBlock(data)}\n  <div id="brand-list-container">`
        );
      } else {
        html = html.replace('</main>', `${pageBlock(data)}\n    </main>`);
      }
    }

    if (html !== original) {
      await writeFile(file, html);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
