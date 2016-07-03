var compiler = require('./compiler');

var runtime = require('./runtime');

function _callbackify(fn) {
  var expectedArgs = fn.length;

  return function() {
    var totalArgs = arguments.length;
    var callback = totalArgs > expectedArgs ? arguments[totalArgs - 1] : null;
    var args = null;
    if (typeof callback === 'function') {
      args = Array.prototype.slice.call(arguments, 0, totalArgs - 1);
    } else {
      args = Array.prototype.slice.call(arguments, 0, totalArgs);
      callback = null;
    }

    var output = fn.apply(this, args);

    if (typeof output === 'object' && typeof output.then === 'function') {
      if (!callback) {
        return output;
      }

      output.then(function(str) {
        callback(null, str);
      }).catch(function(err) {
        callback(err);
      });
    } else {
      if (callback) {
        callback(null, output);
        return undefined;
      }
      return output;
    }

    return undefined;
  };
}

function Lisplate(options) {
  if (!options) {
    options = {};
  }

  // cacheEnabled must be explicitly set to false to disable
  this.cacheEnabled = !(options.cacheEnabled === false);

  this.sourceLoader = options.sourceLoader;
  this.viewModelLoader = options.viewModelLoader;
  this.stringsLoader = options.stringsLoader;

  this.helpers = {};
  this.cache = {};
}

Lisplate.prototype.addHelper = function addHelper(helperName, fn) {
  this.helpers[helperName] = fn;
};

Lisplate.prototype.loadTemplate = _callbackify(function loadTemplate(templateName) {
  var _self = this;

  if (!templateName) {
    return Promise.reject(new Error('Must specify a template to load'));
  }

  if (typeof templateName === 'function') {
    return Promise.resolve(templateName);
  }

  if (_self.cache[templateName]) {
    return Promise.resolve(_self.cache[templateName]);
  }

  if (!_self.sourceLoader) {
    return Promise.reject(new Error('Must define a sourceLoader'));
  }

  return _self.sourceLoader(templateName).then(function(src) {
    return _self.compileFn(templateName, src);
  });
});

Lisplate.prototype.compileFn = _callbackify(function compileFn(templateName, src) {
  var _self = this;

  var compiled = _self.compile(templateName, src);

  var factory = _self.loadCompiledSource(compiled);

  var promise = null;
  if (_self.viewModelLoader) {
    promise = _self.viewModelLoader(templateName);
  } else {
    promise = Promise.resolve(null);
  }
  return promise.then(function(viewModelClass) {
    var fn = factory(viewModelClass);
    fn.templateName = templateName;
    _self.cache[templateName] = fn;
    return fn;
  });
});

Lisplate.prototype.compile = compiler;

Lisplate.prototype.loadCompiledSource = function loadCompiledSource(compiledSource) {
  var template = null;
  eval('template=' + compiledSource);
  return template;
};

Lisplate.prototype.render = _callbackify(function render(template, data) {
  var _self = this;
  if (_self.stringsLoader) {
    return _self
      .stringsLoader(template.templateName)
      .then(function(strings) {
        return template(_self, data, strings, runtime);
      });
  } else {
    // done this way for non-async optimization
    return template(_self, data, null, runtime);
  }
});

Lisplate.prototype.renderTemplate = _callbackify(function renderTemplate(templateName, data) {
  var _self = this;

  return _self.loadTemplate(templateName).then(function(template) {
    return _self.render(template, data);
  });
});

module.exports = Lisplate;