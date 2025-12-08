function hideAllButCurrent() {
  //by default all submenut items are hidden
  //but we need to rehide them for search
  document.querySelectorAll('nav > ul').forEach((parent) => {
    if (parent.className.indexOf('collapse_top') !== -1) {
      parent.style.display = 'none';
    }
  });
  document.querySelectorAll('nav > ul > li > ul li').forEach((parent) => {
    parent.style.display = 'none';
  });
  document.querySelectorAll('nav > h3').forEach((section) => {
    if (section.className.indexOf('collapsed_header') !== -1) {
      section.addEventListener('click', () => {
        if (section.nextSibling.style.display === 'none') {
          section.nextSibling.style.display = 'block';
        } else {
          section.nextSibling.style.display = 'none';
        }
      });
    }
  });

  //only current page (if it exists) should be opened
  var file = window.location.pathname
    .split('/')
    .pop()
    .replace(/\.html/, '');
  document.querySelectorAll('nav > ul > li > a').forEach((parent) => {
    var href = parent.attributes.href.value.replace(/\.html/, '');
    if (file === href) {
      if (parent.parentNode.parentNode.className.indexOf('collapse_top') !== -1) {
        parent.parentNode.parentNode.style.display = 'block';
      }
      parent.parentNode.querySelectorAll('ul li').forEach((elem) => {
        elem.style.display = 'block';
      });
    }
  });
}

hideAllButCurrent();
