import {
  autoUpdatingRelativeAge,
  durationTiny,
  longDate,
  number,
  relativeAge,
  updateRelativeAge,
} from "discourse/lib/formatter";
import { discourseModule } from "discourse/tests/helpers/qunit-helpers";
import sinon from "sinon";
import { test } from "qunit";

function stringToDOMNode(string) {
  let template = document.createElement("template");
  string = string.trim();
  template.innerHTML = string;
  return template.content.firstChild;
}

function formatMins(mins, opts = {}) {
  let dt = new Date(new Date() - mins * 60 * 1000);
  return relativeAge(dt, {
    format: opts.format || "tiny",
    leaveAgo: opts.leaveAgo,
  });
}

function formatHours(hours, opts) {
  return formatMins(hours * 60, opts);
}

function formatDays(days, opts) {
  return formatHours(days * 24, opts);
}

function shortDate(days) {
  return moment().subtract(days, "days").format("MMM D");
}

function shortDateTester(format) {
  return function (days) {
    return moment().subtract(days, "days").format(format);
  };
}

function strip(html) {
  return stringToDOMNode(html).innerText;
}

discourseModule("Unit | Utility | formatter", function (hooks) {
  hooks.beforeEach(function () {
    this.clock = sinon.useFakeTimers(new Date(2012, 11, 31, 12, 0).getTime());
  });

  hooks.afterEach(function () {
    this.clock.restore();
  });

  test("formating medium length dates", function (assert) {
    let shortDateYear = shortDateTester("MMM D, 'YY");

    assert.equal(
      strip(formatMins(1.4, { format: "medium", leaveAgo: true })),
      "1 min ago"
    );
    assert.equal(
      strip(formatMins(2, { format: "medium", leaveAgo: true })),
      "2 mins ago"
    );
    assert.equal(
      strip(formatMins(55, { format: "medium", leaveAgo: true })),
      "55 mins ago"
    );
    assert.equal(
      strip(formatMins(56, { format: "medium", leaveAgo: true })),
      "1 hour ago"
    );
    assert.equal(
      strip(formatHours(4, { format: "medium", leaveAgo: true })),
      "4 hours ago"
    );
    assert.equal(
      strip(formatHours(22, { format: "medium", leaveAgo: true })),
      "22 hours ago"
    );
    assert.equal(
      strip(formatHours(23, { format: "medium", leaveAgo: true })),
      "23 hours ago"
    );
    assert.equal(
      strip(formatHours(23.5, { format: "medium", leaveAgo: true })),
      "1 day ago"
    );
    assert.equal(
      strip(formatDays(4.85, { format: "medium", leaveAgo: true })),
      "4 days ago"
    );

    assert.equal(strip(formatMins(0, { format: "medium" })), "just now");
    assert.equal(strip(formatMins(1.4, { format: "medium" })), "1 min");
    assert.equal(strip(formatMins(2, { format: "medium" })), "2 mins");
    assert.equal(strip(formatMins(55, { format: "medium" })), "55 mins");
    assert.equal(strip(formatMins(56, { format: "medium" })), "1 hour");
    assert.equal(strip(formatHours(4, { format: "medium" })), "4 hours");
    assert.equal(strip(formatHours(22, { format: "medium" })), "22 hours");
    assert.equal(strip(formatHours(23, { format: "medium" })), "23 hours");
    assert.equal(strip(formatHours(23.5, { format: "medium" })), "1 day");
    assert.equal(strip(formatDays(4.85, { format: "medium" })), "4 days");

    assert.equal(strip(formatDays(6, { format: "medium" })), shortDate(6));
    assert.equal(strip(formatDays(100, { format: "medium" })), shortDate(100)); // eg: Jan 23
    assert.equal(
      strip(formatDays(500, { format: "medium" })),
      shortDateYear(500)
    );

    assert.equal(
      stringToDOMNode(formatDays(0, { format: "medium" })).title,
      longDate(new Date())
    );

    assert.ok(
      stringToDOMNode(formatDays(0, { format: "medium" })).classList.contains(
        "date"
      )
    );

    this.clock.restore();
    this.clock = sinon.useFakeTimers(new Date(2012, 0, 9, 12, 0).getTime()); // Jan 9, 2012

    assert.equal(strip(formatDays(8, { format: "medium" })), shortDate(8));
    assert.equal(
      strip(formatDays(10, { format: "medium" })),
      shortDateYear(10)
    );
  });

  test("formating tiny dates", function (assert) {
    let shortDateYear = shortDateTester("MMM 'YY");

    assert.equal(formatMins(0), "1m");
    assert.equal(formatMins(1), "1m");
    assert.equal(formatMins(2), "2m");
    assert.equal(formatMins(60), "1h");
    assert.equal(formatHours(4), "4h");
    assert.equal(formatHours(23), "23h");
    assert.equal(formatHours(23.5), "1d");
    assert.equal(formatDays(1), "1d");
    assert.equal(formatDays(14), "14d");
    assert.equal(formatDays(15), shortDate(15));
    assert.equal(formatDays(92), shortDate(92));
    assert.equal(formatDays(364), shortDate(364));
    assert.equal(formatDays(365), shortDate(365));
    assert.equal(formatDays(366), shortDateYear(366)); // leap year
    assert.equal(formatDays(500), shortDateYear(500));
    assert.equal(formatDays(365 * 2 + 1), shortDateYear(365 * 2 + 1)); // one leap year

    assert.equal(formatMins(-1), "1m");
    assert.equal(formatMins(-2), "2m");
    assert.equal(formatMins(-60), "1h");
    assert.equal(formatHours(-4), "4h");
    assert.equal(formatHours(-23), "23h");
    assert.equal(formatHours(-23.5), "1d");
    assert.equal(formatDays(-1), "1d");
    assert.equal(formatDays(-14), "14d");
    assert.equal(formatDays(-15), shortDateYear(-15));
    assert.equal(formatDays(-92), shortDateYear(-92));
    assert.equal(formatDays(-364), shortDateYear(-364));
    assert.equal(formatDays(-365), shortDateYear(-365));
    assert.equal(formatDays(-366), shortDateYear(-366)); // leap year
    assert.equal(formatDays(-500), shortDateYear(-500));
    assert.equal(formatDays(-365 * 2 - 1), shortDateYear(-365 * 2 - 1)); // one leap year

    let originalValue = this.siteSettings.relative_date_duration;
    this.siteSettings.relative_date_duration = 7;
    assert.equal(formatDays(7), "7d");
    assert.equal(formatDays(8), shortDate(8));

    this.siteSettings.relative_date_duration = 1;
    assert.equal(formatDays(1), "1d");
    assert.equal(formatDays(2), shortDate(2));

    this.siteSettings.relative_date_duration = 0;
    assert.equal(formatMins(0), "1m");
    assert.equal(formatMins(1), "1m");
    assert.equal(formatMins(2), "2m");
    assert.equal(formatMins(60), "1h");
    assert.equal(formatDays(1), shortDate(1));
    assert.equal(formatDays(2), shortDate(2));
    assert.equal(formatDays(366), shortDateYear(366));

    this.siteSettings.relative_date_duration = null;
    assert.equal(formatDays(1), "1d");
    assert.equal(formatDays(14), "14d");
    assert.equal(formatDays(15), shortDate(15));

    this.siteSettings.relative_date_duration = 14;

    this.clock.restore();
    this.clock = sinon.useFakeTimers(new Date(2012, 0, 12, 12, 0).getTime()); // Jan 12, 2012

    assert.equal(formatDays(11), "11d");
    assert.equal(formatDays(14), "14d");
    assert.equal(formatDays(15), shortDateYear(15));
    assert.equal(formatDays(366), shortDateYear(366));

    this.clock.restore();
    this.clock = sinon.useFakeTimers(new Date(2012, 0, 20, 12, 0).getTime()); // Jan 20, 2012

    assert.equal(formatDays(14), "14d");
    assert.equal(formatDays(15), shortDate(15));
    assert.equal(formatDays(20), shortDateYear(20));

    this.siteSettings.relative_date_duration = originalValue;
  });

  test("autoUpdatingRelativeAge", function (assert) {
    let d = moment().subtract(1, "day").toDate();

    let elem = stringToDOMNode(autoUpdatingRelativeAge(d));
    assert.equal(elem.dataset.format, "tiny");
    assert.equal(elem.dataset.time, d.getTime());
    assert.equal(elem.title, "");

    elem = stringToDOMNode(autoUpdatingRelativeAge(d, { title: true }));
    assert.equal(elem.title, longDate(d));

    elem = stringToDOMNode(
      autoUpdatingRelativeAge(d, {
        format: "medium",
        title: true,
        leaveAgo: true,
      })
    );

    assert.equal(elem.dataset.format, "medium-with-ago");
    assert.equal(elem.dataset.time, d.getTime());
    assert.equal(elem.title, longDate(d));
    assert.equal(elem.innerHTML, "1 day ago");

    elem = stringToDOMNode(autoUpdatingRelativeAge(d, { format: "medium" }));
    assert.equal(elem.dataset.format, "medium");
    assert.equal(elem.dataset.time, d.getTime());
    assert.equal(elem.title, "");
    assert.equal(elem.innerHTML, "1 day");
  });

  test("updateRelativeAge", function (assert) {
    let d = new Date();
    let elem = stringToDOMNode(autoUpdatingRelativeAge(d));
    elem.dataset.time = d.getTime() - 2 * 60 * 1000;

    updateRelativeAge(elem);

    assert.equal(elem.innerHTML, "2m");

    d = new Date();
    elem = stringToDOMNode(
      autoUpdatingRelativeAge(d, { format: "medium", leaveAgo: true })
    );
    elem.dataset.time = d.getTime() - 2 * 60 * 1000;

    updateRelativeAge(elem);

    assert.equal(elem.innerHTML, "2 mins ago");
  });

  test("number", function (assert) {
    assert.equal(
      number(123),
      "123",
      "it returns a string version of the number"
    );
    assert.equal(number("123"), "123", "it works with a string command");
    assert.equal(number(NaN), "0", "it returns 0 for NaN");
    assert.equal(number(3333), "3.3k", "it abbreviates thousands");
    assert.equal(number(2499999), "2.5M", "it abbreviates millions");
    assert.equal(number("2499999.5"), "2.5M", "it abbreviates millions");
    assert.equal(number(1000000), "1.0M", "it abbreviates a million");
    assert.equal(
      number(999999),
      "999k",
      "it abbreviates hundreds of thousands"
    );
    assert.equal(
      number(18.2),
      "18",
      "it returns a float number rounded to an integer as a string"
    );
    assert.equal(
      number(18.6),
      "19",
      "it returns a float number rounded to an integer as a string"
    );
    assert.equal(
      number("12.3"),
      "12",
      "it returns a string float rounded to an integer as a string"
    );
    assert.equal(
      number("12.6"),
      "13",
      "it returns a string float rounded to an integer as a string"
    );
  });

  test("durationTiny", function (assert) {
    assert.equal(durationTiny(), "&mdash;", "undefined is a dash");
    assert.equal(durationTiny(null), "&mdash;", "null is a dash");
    assert.equal(durationTiny(0), "< 1m", "0 seconds shows as < 1m");
    assert.equal(durationTiny(59), "< 1m", "59 seconds shows as < 1m");
    assert.equal(durationTiny(60), "1m", "60 seconds shows as 1m");
    assert.equal(durationTiny(90), "2m", "90 seconds shows as 2m");
    assert.equal(durationTiny(120), "2m", "120 seconds shows as 2m");
    assert.equal(durationTiny(60 * 45), "1h", "45 minutes shows as 1h");
    assert.equal(durationTiny(60 * 60), "1h", "60 minutes shows as 1h");
    assert.equal(durationTiny(60 * 90), "2h", "90 minutes shows as 2h");
    assert.equal(durationTiny(3600 * 23), "23h", "23 hours shows as 23h");
    assert.equal(
      durationTiny(3600 * 24 - 29),
      "1d",
      "23 hours 31 mins shows as 1d"
    );
    assert.equal(durationTiny(3600 * 24 * 89), "89d", "89 days shows as 89d");
    assert.equal(
      durationTiny(60 * (525600 - 1)),
      "12mon",
      "364 days shows as 12mon"
    );
    assert.equal(durationTiny(60 * 525600), "1y", "365 days shows as 1y");
    assert.equal(durationTiny(86400 * 456), "1y", "456 days shows as 1y");
    assert.equal(durationTiny(86400 * 457), "> 1y", "457 days shows as > 1y");
    assert.equal(durationTiny(86400 * 638), "> 1y", "638 days shows as > 1y");
    assert.equal(durationTiny(86400 * 639), "2y", "639 days shows as 2y");
    assert.equal(durationTiny(86400 * 821), "2y", "821 days shows as 2y");
    assert.equal(durationTiny(86400 * 822), "> 2y", "822 days shows as > 2y");
  });
});
