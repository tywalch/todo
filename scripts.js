(function todo() {
  const textStyles = {
    'todo': {
      'type': 'primary',
      "styles": {
        "color": '#A8C023',
      }
    },
    'idea': {
      'type': 'primary',
      "styles": {
        "color": '#5FB8C0',
      }
    },
    'redo': {
      'type': 'primary',
      "styles": {
        "color": '#C0547E',
      }
    },
    'info': {
      'type': 'primary',
      "styles": {
        "color": '#FFD000',
      }
    },
    'talk': {
      'type': 'primary',
      "styles": {
        "color": '#AE61FF',
      }
    },
    'task': {
      'type': 'primary',
      "styles": {
        "color": '#FF942A',
      }
    },
    'hold': {
      'type': 'primary',
      "styles": {
        "color": '#BDBDC0',
      }
    },
    '\\*': {
      'type': 'override',
      "styles": {
        "color": '#7b7b7b',
        "textDecoration": 'line-through'
      }
    },
    '\\|': {
      'type': 'override',
      "styles": {
        "font-weight": 'bolder',
      }
    },
    '': {
      'type': 'default',
      "styles": {
        "color": '#B2B3B8',
        "font-weight": 'normal',
        "textDecoration": 'none'
      }
    }
  }
  
  const store = {
    save: function(values) {
      const json = JSON.stringify({
        data: values
      });
      return localStorage.setItem('values', json);
    },
    read: function() {
      const values = localStorage.getItem('values');
      return values ? JSON.parse(values).data : undefined;
    }
  }
  
  function getStylesByType(type) {
    const stylings = {}
    for (const matchString in textStyles) {
      if (type === textStyles[matchString].type) {
        stylings[matchString] = {};
        stylings[matchString].type = textStyles[matchString].type;
        stylings[matchString].styles = Object.assign({}, textStyles[matchString].styles)
      }
    }
    return stylings; 
  }
  
  function getStyle(text, colors) {
    text = text.trim().toLowerCase();
    for (const styles in colors) {
      const regex = new RegExp(styles)
      const match = text.match(regex);
      if (match) {
        return colors[styles].styles;
      }
    }
  }
  
  function styleLine(element, text = '') {
    const defaults = getStylesByType('default');
    const overrides = getStylesByType('override');
    const primaries = getStylesByType('primary');
    const styles = Object.assign(getStyle(text, defaults), getStyle(text, primaries), getStyle(text, overrides))
    for (const attribute in styles) {
      element.style[attribute] = styles[attribute];
    }
  }
  
  function shiftText(backwards, customCharacters) {
    const TAB = customCharacters || "\u00a0\u00a0";
    const editor = document.getElementById("content");
    const doc = editor.ownerDocument.defaultView;
    const sel = doc.getSelection();
    const range = sel.getRangeAt(0);
    const nodes = Array.from(sel.anchorNode.childNodes)
    const child = nodes.find(node => node.nodeValue === TAB);
    const spaces = nodes.find(node => node.nodeValue && node.nodeValue.match(/^([\s]{2})|^([\s]{1})/));
    
    const tabNode = backwards ? document.createTextNode("") : document.createTextNode(TAB);
    if (backwards && child) child.nodeValue = '';
    else if (backwards && spaces) spaces.nodeValue = spaces.nodeValue.replace(/^([\s]{2})|^([\s]{1})/, '');
    
    range.insertNode(tabNode);
    range.setStartAfter(tabNode);
    range.setEndAfter(tabNode); 
    sel.removeAllRanges();
    sel.addRange(range);
  }
  
  function addItem(content, text) {
    function createElement(text) {
      const TEMPLATE = '<div><span class="line"></span></div>';
      const tmp = document.implementation.createHTMLDocument();
      tmp.body.innerHTML = TEMPLATE;
      tmp.body.children[0].children[0].innerText = text;
      styleLine(tmp.body.children[0].children[0], text);
      return tmp.body.children[0];
    };
    const item = createElement(text);
    if (text === '') {
      content.appendChild(item).children[0].innerHTML = '</br>';
    } else {
      content.appendChild(item).children[0].innerText = text;
    }
  }
  
  function appendSavedLines(target, lines = []) {
    lines.forEach(line => addItem(target, line))
  }
  
  function getValues() {
    function reduceLines(result, line) {
      const validLine = !line.match(/(\r|\n)/);
      const lineIsEmpty = line === '';
      if (!validLine) return result;
      else if (result.acceptPrior === false) {
        result.acceptPrior = true;
        return result;
      }
       
      if (validLine && lineIsEmpty) {
        result.acceptPrior = false;
        result.data.push(line);
      } else if (validLine) {
        result.data.push(line);
      }
      return result;
    }
    
    return document.getElementById('content')
      .innerText
      .split(/(\r|\n)/)
      .reduce(reduceLines, {acceptPrior: true, data: []})
      .data;
  }
  
  function saveContent() {
    const values = getValues();
    store.save(values);
  }
  
  function configureHandlers(element) {
    element.addEventListener('keydown', function(button) {
      const key = button.key;
      const isTab = key === 'Tab';
      const isShift = button.shiftKey;
      if (isTab) {
        button.preventDefault();
        shiftText(isShift);
      }
    })
    const config = { attributes: true, childList: true, subtree: true, characterData: true };
    const observer = new MutationObserver(function(mutations){
      mutations.forEach(function(mutation){
        saveContent();
        const target = mutation.target;
        const parent = mutation.target.parentNode;
        const type = mutation.type;
        let text = ''
        if (type === 'characterData') {
          if (!parent) return;
          text = parent.innerText;
          if (!text.trim()) return;
          if (parent !== element) styleLine(parent, text);
        } else if (type === 'childList') {
          //console.log('innerText', mutation.target.innerText);
        }
      });    
    });
  
    observer.observe(element, config);
  }
  
  function prepareContentSpace(element) {
    element.innerText = '';
    const savedLines = store.read() || [
      `|KEY - Use a vertical pipe to make "header"`,
      `todo - item that needs doing`,
      `redo - fix this item`,
      `info - information for later reference`,
      `talk - item to discuss with team member`,
      `task - assignable task for an individual`,
      `idea - note on where in a process an item was left to aid in jumping back in`,
      `*todo - asterisk notes a line item is finished.`
      ``,
      ``,
      `info: prefix the line with one of the above keywords, organize by indenting with tabs, shift-tab also works!`
    ];
    appendSavedLines(element, savedLines);
  }
  
  function prepareDocument() {
    const content = document.getElementById('content');
    prepareContentSpace(content);
    configureHandlers(content);
  }
  
  prepareDocument();
  
  })();
