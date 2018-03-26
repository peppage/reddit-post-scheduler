if (window.Vue) {
  var postList = new Vue({
    el: '.ps-posts-list',
    data: {
      dates: [],
      days: 14,
    },
    created: function() {
      var self = this;
      for (var i = 0; i < self.days - 1; i++) {
        var m = moment().add(i, 'days');
        self.dates.push({
          month: m.month(),
          day: m.date(),
          display: m.format('dddd, MMMM Do YYYY'),
          posts: [],
        });
      }

      var params = '?';
      params += 'start=' + formatDate(new Date());
      params += '&days=' + self.days;

      fetch('/api/posts' + params)
        .then(function(response) {
          return response.json();
        })
        .then(function(json) {
          json.forEach(function(p) {
            var postDate = moment(p.date);
            self.dates.forEach(function(d) {
              if (d.month == postDate.month() && d.day == postDate.date()) {
                d.posts.push(p);
              }
            });
          });
        });
    },
    mounted: function() {},
    computed: {},
    updated: function() {},
    methods: {
      addTheme: function() {},
    },
  });

  // Format the date for our requirements as year-month-day
  function formatDate(date) {
    var d = 'Y-m-d'
      .replace('Y', date.getFullYear())
      .replace('m', date.getMonth() + 1)
      .replace('d', date.getDate());
    return d;
  }
}
