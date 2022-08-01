// TOASTR

(function (define) {
  define(["jquery"], function ($) {
    return (function () {
      var $container;
      var listener;
      var toastId = 0;
      var toastType = {
        error: "error",
        info: "info",
        success: "success",
        warning: "warning",
      };

      var fhToastr = {
        clear: clear,
        remove: remove,
        error: error,
        getContainer: getContainer,
        info: info,
        options: {},
        subscribe: subscribe,
        success: success,
        version: "2.1.4",
        warning: warning,
      };

      var previousToast;

      return fhToastr;

      ////////////////

      function error(message, title, optionsOverride) {
        return notify({
          type: toastType.error,
          iconClass: getOptions().iconClasses.error,
          message: message,
          optionsOverride: optionsOverride,
          title: title,
        });
      }

      function getContainer(options, create) {
        if (!options) {
          options = getOptions();
        }
        $container = $("#" + options.containerId);
        if ($container.length) {
          return $container;
        }
        if (create) {
          $container = createContainer(options);
        }
        return $container;
      }

      function info(message, title, optionsOverride) {
        return notify({
          type: toastType.info,
          iconClass: getOptions().iconClasses.info,
          message: message,
          optionsOverride: optionsOverride,
          title: title,
        });
      }

      function subscribe(callback) {
        listener = callback;
      }

      function success(message, title, optionsOverride) {
        return notify({
          type: toastType.success,
          iconClass: getOptions().iconClasses.success,
          message: message,
          optionsOverride: optionsOverride,
          title: title,
        });
      }

      function warning(message, title, optionsOverride) {
        return notify({
          type: toastType.warning,
          iconClass: getOptions().iconClasses.warning,
          message: message,
          optionsOverride: optionsOverride,
          title: title,
        });
      }

      function clear($toastElement, clearOptions) {
        var options = getOptions();
        if (!$container) {
          getContainer(options);
        }
        if (!clearToast($toastElement, options, clearOptions)) {
          clearContainer(options);
        }
      }

      function remove($toastElement) {
        var options = getOptions();
        if (!$container) {
          getContainer(options);
        }
        if ($toastElement && $(":focus", $toastElement).length === 0) {
          removeToast($toastElement);
          return;
        }
        if ($container.children().length) {
          $container.remove();
        }
      }

      // internal functions

      function clearContainer(options) {
        var toastsToClear = $container.children();
        for (var i = toastsToClear.length - 1; i >= 0; i--) {
          clearToast($(toastsToClear[i]), options);
        }
      }

      function clearToast($toastElement, options, clearOptions) {
        var force =
          clearOptions && clearOptions.force ? clearOptions.force : false;
        if (
          $toastElement &&
          (force || $(":focus", $toastElement).length === 0)
        ) {
          $toastElement[options.hideMethod]({
            duration: options.hideDuration,
            easing: options.hideEasing,
            complete: function () {
              removeToast($toastElement);
            },
          });
          return true;
        }
        return false;
      }

      function createContainer(options) {
        $container = $("<div/>")
          .attr("id", options.containerId)
          .addClass(options.positionClass);

        $container.appendTo($(options.target));
        return $container;
      }

      function getDefaults() {
        return {
          tapToDismiss: true,
          toastClass: "formhelper-toast",
          containerId: "formhelper-toast-container",
          debug: false,

          showMethod: "fadeIn", //fadeIn, slideDown, and show are built into jQuery
          showDuration: 300,
          showEasing: "swing", //swing and linear are built into jQuery
          onShown: undefined,
          hideMethod: "fadeOut",
          hideDuration: 1000,
          hideEasing: "swing",
          onHidden: undefined,
          closeMethod: false,
          closeDuration: false,
          closeEasing: false,
          closeOnHover: true,

          extendedTimeOut: 1000,
          iconClasses: {
            error: "formhelper-toast-error",
            info: "formhelper-toast-info",
            success: "formhelper-toast-success",
            warning: "formhelper-toast-warning",
          },
          iconClass: "formhelper-toast-info",
          positionClass: "formhelper-toast-top-right",
          timeOut: 5000, // Set timeOut and extendedTimeOut to 0 to make it sticky
          titleClass: "formhelper-toast-title",
          messageClass: "formhelper-toast-message",
          escapeHtml: false,
          target: "body",
          closeHtml: '<button type="button">&times;</button>',
          closeClass: "formhelper-toast-close-button",
          newestOnTop: true,
          preventDuplicates: false,
          progressBar: false,
          progressClass: "formhelper-toast-progress",
          rtl: false,
        };
      }

      function publish(args) {
        if (!listener) {
          return;
        }
        listener(args);
      }

      function notify(map) {
        var options = getOptions();
        var iconClass = map.iconClass || options.iconClass;

        if (typeof map.optionsOverride !== "undefined") {
          options = $.extend(options, map.optionsOverride);
          iconClass = map.optionsOverride.iconClass || iconClass;
        }

        if (shouldExit(options, map)) {
          return;
        }

        toastId++;

        $container = getContainer(options, true);

        var intervalId = null;
        var $toastElement = $("<div/>");
        var $titleElement = $("<div/>");
        var $messageElement = $("<div/>");
        var $progressElement = $("<div/>");
        var $closeElement = $(options.closeHtml);
        var progressBar = {
          intervalId: null,
          hideEta: null,
          maxHideTime: null,
        };
        var response = {
          toastId: toastId,
          state: "visible",
          startTime: new Date(),
          options: options,
          map: map,
        };

        personalizeToast();

        displayToast();

        handleEvents();

        publish(response);

        if (options.debug && console) {
          console.log(response);
        }

        return $toastElement;

        function escapeHtml(source) {
          if (source === null) {
            source = "";
          }

          return source
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        }

        function personalizeToast() {
          setIcon();
          setTitle();
          setMessage();
          setCloseButton();
          setProgressBar();
          setRTL();
          setSequence();
          setAria();
        }

        function setAria() {
          var ariaValue = "";
          switch (map.iconClass) {
            case "formhelper-toast-success":
            case "formhelper-toast-info":
              ariaValue = "polite";
              break;
            default:
              ariaValue = "assertive";
          }
          $toastElement.attr("aria-live", ariaValue);
        }

        function handleEvents() {
          if (options.closeOnHover) {
            $toastElement.hover(stickAround, delayedHideToast);
          }

          if (!options.onclick && options.tapToDismiss) {
            $toastElement.click(hideToast);
          }

          if (options.closeButton && $closeElement) {
            $closeElement.click(function (event) {
              if (event.stopPropagation) {
                event.stopPropagation();
              } else if (
                event.cancelBubble !== undefined &&
                event.cancelBubble !== true
              ) {
                event.cancelBubble = true;
              }

              if (options.onCloseClick) {
                options.onCloseClick(event);
              }

              hideToast(true);
            });
          }

          if (options.onclick) {
            $toastElement.click(function (event) {
              options.onclick(event);
              hideToast();
            });
          }
        }

        function displayToast() {
          $toastElement.hide();

          $toastElement[options.showMethod]({
            duration: options.showDuration,
            easing: options.showEasing,
            complete: options.onShown,
          });

          if (options.timeOut > 0) {
            intervalId = setTimeout(hideToast, options.timeOut);
            progressBar.maxHideTime = parseFloat(options.timeOut);
            progressBar.hideEta =
              new Date().getTime() + progressBar.maxHideTime;
            if (options.progressBar) {
              progressBar.intervalId = setInterval(updateProgress, 10);
            }
          }
        }

        function setIcon() {
          if (map.iconClass) {
            $toastElement.addClass(options.toastClass).addClass(iconClass);
          }
        }

        function setSequence() {
          if (options.newestOnTop) {
            $container.prepend($toastElement);
          } else {
            $container.append($toastElement);
          }
        }

        function setTitle() {
          if (map.title) {
            var suffix = map.title;
            if (options.escapeHtml) {
              suffix = escapeHtml(map.title);
            }
            $titleElement.append(suffix).addClass(options.titleClass);
            $toastElement.append($titleElement);
          }
        }

        function setMessage() {
          if (map.message) {
            var suffix = map.message;
            if (options.escapeHtml) {
              suffix = escapeHtml(map.message);
            }
            $messageElement.append(suffix).addClass(options.messageClass);
            $toastElement.append($messageElement);
          }
        }

        function setCloseButton() {
          if (options.closeButton) {
            $closeElement.addClass(options.closeClass).attr("role", "button");
            $toastElement.prepend($closeElement);
          }
        }

        function setProgressBar() {
          if (options.progressBar) {
            $progressElement.addClass(options.progressClass);
            $toastElement.prepend($progressElement);
          }
        }

        function setRTL() {
          if (options.rtl) {
            $toastElement.addClass("rtl");
          }
        }

        function shouldExit(options, map) {
          if (options.preventDuplicates) {
            if (map.message === previousToast) {
              return true;
            } else {
              previousToast = map.message;
            }
          }
          return false;
        }

        function hideToast(override) {
          var method =
            override && options.closeMethod !== false
              ? options.closeMethod
              : options.hideMethod;
          var duration =
            override && options.closeDuration !== false
              ? options.closeDuration
              : options.hideDuration;
          var easing =
            override && options.closeEasing !== false
              ? options.closeEasing
              : options.hideEasing;
          if ($(":focus", $toastElement).length && !override) {
            return;
          }
          clearTimeout(progressBar.intervalId);
          return $toastElement[method]({
            duration: duration,
            easing: easing,
            complete: function () {
              removeToast($toastElement);
              clearTimeout(intervalId);
              if (options.onHidden && response.state !== "hidden") {
                options.onHidden();
              }
              response.state = "hidden";
              response.endTime = new Date();
              publish(response);
            },
          });
        }

        function delayedHideToast() {
          if (options.timeOut > 0 || options.extendedTimeOut > 0) {
            intervalId = setTimeout(hideToast, options.extendedTimeOut);
            progressBar.maxHideTime = parseFloat(options.extendedTimeOut);
            progressBar.hideEta =
              new Date().getTime() + progressBar.maxHideTime;
          }
        }

        function stickAround() {
          clearTimeout(intervalId);
          progressBar.hideEta = 0;
          $toastElement.stop(true, true)[options.showMethod]({
            duration: options.showDuration,
            easing: options.showEasing,
          });
        }

        function updateProgress() {
          var percentage =
            ((progressBar.hideEta - new Date().getTime()) /
              progressBar.maxHideTime) *
            100;
          $progressElement.width(percentage + "%");
        }
      }

      function getOptions() {
        return $.extend({}, getDefaults(), fhToastr.options);
      }

      function removeToast($toastElement) {
        if (!$container) {
          $container = getContainer();
        }
        if ($toastElement.is(":visible")) {
          return;
        }
        $toastElement.remove();
        $toastElement = null;
        if ($container.children().length === 0) {
          $container.remove();
          previousToast = undefined;
        }
      }
    })();
  });
})(
  typeof define === "function" && define.amd
    ? define
    : function (deps, factory) {
        if (typeof module !== "undefined" && module.exports) {
          //Node
          module.exports = factory(require("jquery"));
        } else {
          window.fhToastr = factory(window.jQuery);
        }
      }
);

// FORM HELPER

(function ($) {
  "use strict";

  $(document).on("click", "form[formhelper]", (element) => {
    const form = $(element.currentTarget);

    const options = {
      url: form.attr("action"),
      method: form.attr("method"),
      dataType: form.attr("dataType"),
      checkTheFormFieldsMessage: form.attr("CheckTheFormFieldsMessage"),
      redirectDelay: parseInt(form.attr("redirectDelay")),
      beforeSubmit: form.attr("beforeSubmit"),
      callback: form.attr("callback"),
      enableButtonAfterSuccess:
        form.attr("enableButtonAfterSuccess") === "True",
      resetFormAfterSuccess: form.attr("ResetFormAfterSuccess") === "True",
      toastrPositionClass: form.attr("toastrPositionClass"),
    };

    return new $.formhelper(options, form[0]);
  });

  function mobileAndTabletcheck() {
    var check = false;
    (function (a) {
      if (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
          a
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
          a.substr(0, 4)
        )
      )
        check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
  }

  function callFunction(name, result) {
    var parts = name.split(".");
    var n;
    var obj = window;
    for (n = 0; n < parts.length; ++n) {
      obj = obj[parts[n]];
      if (!obj) {
        return;
      }
    }
    return obj ? obj(result) : undefined;
  }

  $.formhelper = function (options, el) {
    var self = this;
    var $form = $(el);

    if (window.FormData === undefined) {
      $form.find("button[type='submit']").attr("disabled", "disabled");
      alert(
        "Your internet browser is too old and not compatible with Form Helper! Update your browser."
      );
      return;
    }

    $($form)
      .find("input, select, textarea")
      .on("blur", function (el) {
        $(el.target).valid();
      });

    options = $.extend({}, $.formhelper.defaultOptions, options);

    $form.unbind("submit");

    $form.on("submit", function (e) {
      e.preventDefault();

      var toastrPositionClass = mobileAndTabletcheck()
        ? "formhelper-toast-top-full-width"
        : options.toastrPositionClass;

      var toastrOptions = {
        positionClass: toastrPositionClass,
      };

      $form.removeData("validator");
      $form.removeData("unobtrusiveValidation");
      $.validator.unobtrusive.parse($form);

      var validationResult = $form.valid();
      var validator = $form.validate();

      if (!validationResult) {
        if (fhToastr) {
          fhToastr.error(
            options.checkTheFormFieldsMessage,
            null,
            toastrOptions
          );
          validator.focusInvalid();
        }
        return false;
      }

      $form.find("button[type='submit']").attr("disabled", "disabled");

      var headers = {};
      var formData = {};
      var contentType = {};

      if (options.dataType === "FormData") {
        formData = new FormData($form[0]);
        contentType = false;
      } else {
        var formDataAsJson = new Object();

        $.each($form.serializeArray(), function (key, item) {
          formDataAsJson[item.name] = item.value;
        });

        if (formDataAsJson.__RequestVerificationToken !== undefined) {
          headers["RequestVerificationToken"] =
            formDataAsJson.__RequestVerificationToken;
        }

        formData = JSON.stringify(formDataAsJson);
        contentType = "application/json; charset=utf-8";
      }

      //send ajax

      $.ajax({
        url: options.url,
        type: options.method,
        headers: headers,
        data: formData,
        contentType: contentType,
        processData: false,
        beforeSend: function (jqXHR, settings) {
          if (options.beforeSubmit) {
            return window[options.beforeSubmit](jqXHR, settings, $form);
          }
        },
        success: function (result, status) {
          if (result.isSucceed === false) {
            $form.find("button[type='submit']").removeAttr("disabled");
          }

          if (result.redirectUri) {
            toastrOptions = {
              timeOut: 0,
              extendedTimeOut: 0,
              positionClass: toastrPositionClass,
            };
          }

          var hasMessage = result.message && result.message !== "";

          if (hasMessage) {
            if (result.status === 1 || result.status === "Success") {
              fhToastr.success(result.message, null, toastrOptions);
            } else if (result.status === 2 || result.status === "Info") {
              fhToastr.info(result.message, null, toastrOptions);
            } else if (result.status === 3 || result.status === "Warning") {
              fhToastr.warning(result.message, null, toastrOptions);
            } else if (result.status === 4 || result.status === "Error") {
              fhToastr.error(result.message, null, toastrOptions);
            }
          } else if (result.isSucceed === false) {
            fhToastr.error(
              options.checkTheFormFieldsMessage,
              null,
              toastrOptions
            );
          }

          if (result.validationErrors && result.validationErrors.length > 0) {
            $form.find("button[type='submit']").removeAttr("disabled");

            for (var i in result.validationErrors) {
              var propertyName = result.validationErrors[i].propertyName;
              var errorMessage = result.validationErrors[i].message;
              var obj = new Object();
              obj[propertyName] = errorMessage;
              validator.showErrors(obj);
            }

            validator.focusInvalid();
          }

          if (options.callback) {
            callFunction(options.callback, result);
          }

          var delay = result.redirectDelay
            ? result.redirectDelay
            : options.redirectDelay;

          if (result.redirectUri) {
            setTimeout(
              function () {
                window.location.replace(result.redirectUri);
              },
              hasMessage ? delay : 1
            );
          }

          if (result.status === 1 || result.status === "Success") {
            if (options.enableButtonAfterSuccess) {
              $form.find("button[type='submit']").removeAttr("disabled");
            }

            if (options.resetFormAfterSuccess) {
              $form[0].reset();
            }
          }
        },
        error: function (request, status, error) {
          console.error(request.responseText);
          fhToastr.error(request.responseText, null, toastrOptions);
        },
      });

      //end ajax request
    });
  };

  $.formhelper.defaultOptions = {
    url: "#",
    method: "POST",
    dataType: "FormData",
    checkTheFormFieldsMessage: "Check the form fields",
    redirectDelay: 1500,
    beforeSubmit: null,
    callback: null,
    enableButtonAfterSuccess: false,
    resetFormAfterSuccess: false,
    toastrPositionClass: null,
  };

  $.fn.fillFormFields = function (data, callbacks = null) {
    var that = this;

    var options = {
      data: data || null,
      callbacks: callbacks,
    };

    if (options.data !== null) {
      $.each(options.data, function (k, v) {
        if (
          options.callbacks != undefined &&
          options.callbacks != null &&
          options.callbacks.hasOwnProperty(k)
        ) {
          options.callbacks[k](v);
        } else {
          var el = $("#" + that[0].id + ' [name="' + k + '" i]');
          if (
            el.prop("tagName") == "SELECT" &&
            el.attr("multiple") !== undefined &&
            el.attr("enumflags") !== undefined
          ) {
            var values = v.toString().split(/[ ,]+/);
            el.val(values);
          } else if (
            el.prop("tagName") == "INPUT" &&
            el.prop("type").toUpperCase() == "CHECKBOX"
          ) {
            if (v === true || v == "true" || v == "1") {
              el.attr("checked", "checked");
            } else {
              el.removeAttr("checked");
            }
          } else if (
            el.prop("tagName") == "INPUT" &&
            el.prop("type").toUpperCase() == "RADIO"
          ) {
            $(`input[name=${k}][value=${v}`).prop("checked", true);
          } else {
            el.val(v);
          }
        }
      });
    }
  };

  $.fn.fhReset = function () {
    this[0].reset();
    this.find("input[type='submit'],button[type='submit']").removeAttr(
      "disabled"
    );
  };
})(jQuery);
