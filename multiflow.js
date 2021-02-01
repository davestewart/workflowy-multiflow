javascript:
  `
WorkFlowy MultiFlow
=============

- A browser Bookmarklet to give you a dual panel WorkFlowy view

Features / Usage:

- Copy and paste between frames
- Use the left pane as navigation by CMD/CTRL+Clicking bullets to load into the right
- Updates main page title with panel titles
- Saves panels between sessions

Installation:

1. Copy this entire script
2. Create a new bookmark whilst on workflowy.com
3. Paste this script into the URL section of the bookmark dialog

Running:

- Click the bookmarklet whilst on workflowy.com to initialize the two-panel setup
- If not on workflowy.com, click the bookmarklet twice; once to load workflowy.com and again to initialize

`;

var WF_URL = 'https://workflowy.com';

/* ---------------------------------------------------------------------------------------------------------------------
 * HELPERS
 */

function stop (event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

function isModifier (event) {
  return navigator.platform.startsWith('Mac')
    ? event.metaKey
    : event.ctrlKey;
}

function isVisible (el) {
  return el.style.display !== 'none';
}

function isLastFrame (frame) {
  return getFrames().reverse().indexOf(frame) === 0;
}

function runWhen (condition, action, interval = 500) {
  return new Promise(function (resolve) {
    var id;
    var run = function () {
      if (condition()) {
        clearInterval(id);
        resolve(action());
        return true;
      }
      return false;
    };
    if (!run()) {
      id = setInterval(run, interval);
    }
  });
}

/* ---------------------------------------------------------------------------------------------------------------------
 * GETTERS
 */

function getDoc (window) {
  return (window.document || window.contentDocument);
}

function getPage (frame) {
  return getDoc(frame).querySelector('.pageContainer');
}

function getFrames () {
  return Array.from(window.frames);
}

function getFrameElement (frame) {
  const index = getFrames().indexOf(frame)
  return document.querySelectorAll('iframe')[index]
}

function getNextFrame (frame) {
  var frames = getFrames();
  var index = frames.indexOf(frame);
  return index > -1
    ? frames[index + 1]
    : undefined;
}

/* ---------------------------------------------------------------------------------------------------------------------
 * FRAMES
 */

function addFrame (src, addClose) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('src', src || WF_URL);
  document.body.appendChild(iframe);
  return setupFrame(iframe.contentWindow, addClose);
}

function removeFrame (frame, hide = false) {
  const iframe = getFrameElement(frame);
  if (hide) {
    iframe.style.display = 'none';
    iframe.parentElement.appendChild(iframe);
  }
  else {
    document.body.removeChild(iframe);
  }
}

function loadNextFrame (frame, href) {
  var nextFrame = getNextFrame(frame);
  if (nextFrame) {
    nextFrame.location.href = href;
    getFrameElement(nextFrame).style.display = 'block';
  }
  else {
    addFrame(href);
  }
}

function loadThisFrame (frame, href) {
  frame.location.href = href;
}

/* ---------------------------------------------------------------------------------------------------------------------
 * PAGE INTERACTION
 */

function addDuplicateHandler (frame) {
  getDoc(frame).querySelector('.breadcrumbs').addEventListener('click', function (event) {
    if (event.target.matches('a:last-of-type') && isModifier(event)) {
      loadNextFrame(frame, frame.location.href);
    }
  });
}

function addBulletHandler (frame) {
  getPage(frame).addEventListener('click', function (event) {
    var selector = 'a.bullet';
    var target = event.target;
    var link = target.matches(selector)
      ? target
      : target.closest(selector);
    if (link && isModifier(event)) {
      loadNextFrame(frame, WF_URL + link.getAttribute('href'));
      stop(event);
    }
  }, { capture: true });
}

function addLinkHandler (frame) {
  getPage(frame).addEventListener('click', function (event) {
    var el = event.target;
    if (el.tagName === 'A') {
      var href = el.getAttribute('href');
      if (href.startsWith(WF_URL)) {
        const hasNext = !isLastFrame(frame);
        const hasModifier = isModifier(event);
        const loadNext = hasNext && !hasModifier || !hasNext && hasModifier;
        loadNext
          ? loadNextFrame(frame, href)
          : loadThisFrame(frame, href);
        stop(event);
      }
    }
  }, { capture: true });
}

function addCloseButton (frame) {
  const doc = getDoc(frame);
  const button = doc.createElement('div');
  doc.body.querySelector('.header').appendChild(button);
  button.style.marginLeft = '-10px';
  button.style.marginRight = '10px';
  button.innerHTML = '<div class="iconButton _pn8v4l"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke-linecap="round" stroke="#b7bcbf" style="position: relative;"><line x1="1" y1="1" x2="19" y2="19"></line><line x1="19" y1="1" x2="1" y2="19"></line></svg></div>';
  button.addEventListener('click', function (event) {
    removeFrame(frame, !isModifier(event))
  });
}

/* ---------------------------------------------------------------------------------------------------------------------
 * SETUP
 */

function setupFrame (frame, addClose = true) {
  return new Promise(function (resolve) {
    frame.addEventListener('load', function () {
      runWhen(checkLoaded(getDoc(frame)), () => {
        addBulletHandler(frame);
        addLinkHandler(frame);
        addDuplicateHandler(frame);
        if (addClose) {
          addCloseButton(frame);
        }
      });
      resolve(frame);
    });
  });
}

function setupStorage () {
  setInterval(function () {
    var frames = getFrames().filter(frame => {
      const iframe = getFrameElement(frame);
      return isVisible(iframe);
    });
    var titles = frames.map(frame => getDoc(frame).title.replace(' - WorkFlowy', ''));
    var title = 'MultiFlow: ' + titles.join(' + ');
    if (document.title !== title) {
      document.title = title;
      var urls = frames.map(frame => frame.location.href);
      localStorage.setItem('multiflow', JSON.stringify({ urls, titles }));
    }
  }, 1000);
}

function setupPage () {
  var data = JSON.parse(localStorage.getItem('multiflow') || '{}');
  var titles = data.titles || [];
  var saved = data.urls || [];
  var current = location.href;
  var loadPrevious = titles.length
    ? confirm(`Load previous flows ?\n\n - ${titles.join('\n - ')}`)
    : false;
  var urls = loadPrevious
    ? saved
    : [current, current];
  document.body.innerHTML = `
    <style>
      html, body, #frames {
        display: flex;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
      }
      iframe {
        flex: 1;
        height: 100%;
      }
      iframe:not(:last-child) {
        border-right: 1px solid #DDD;
        max-width: 700px;
      }
      .page {
        padding: 24px 46px;
        align-items: start;
        margin-left: 0;
      }
    </style>
  `;
  urls.forEach((url, index) => addFrame(url, index > 0));
}

function checkLoaded (document) {
  return function () {
    var app = document.getElementById('app');
    return app && app.innerHTML !== '';
  };
}

function setupApp () {
  /* setup */
  setupPage();
  setupStorage();
  setupFrame(getFrames()[0], false);
  location.replace(WF_URL + '/#multiflow');

  /* done! */
  console.log('MultiFlow is running!');
  console.log('For updates, see original script at: https://gist.github.com/davestewart/a86ed576604cee9f8a15bd97451a6974');
  window.loadState = 'running';
}

/* ---------------------------------------------------------------------------------------------------------------------
 * MAIN
 */

/* load */
if (!window.location.href.startsWith(WF_URL)) {
  console.log('Loading workflowy.com...');
  window.location.href = WF_URL;
}

/* initialize */
else if (!window.loadState) {
  window.loadState = 'initializing';
  console.log('Initializing MultiFlow...');
  runWhen(checkLoaded(document), setupApp);
}

/* already running! */
else {
  console.log('MultiFlow is already ' + window.loadState + '...');
}

void (0);
