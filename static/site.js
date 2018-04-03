if (window.Vue) {
  Vue.use(VueRouter);

  var postList = Vue.component('calendar-list', {
    template: '#calendarList',
    data() {
      return {
        dates: [],
        days: 14,
      };
    },
    created: function() {
      var self = this;
      for (var i = 0; i < self.days - 1; i++) {
        var m = moment().add(i, 'days');
        self.dates.push({
          month: m.month(),
          day: m.date(),
          display: m.format('dddd, MMMM Do YYYY'),
          query: m.format('YYYY-MM-DD'),
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
        .catch(error => console.error('Error:', error))
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

  var newPost = Vue.component('new-post', {
    template: '#post',
    props: ['date'],
    data() {
      return {
        title: '',
        spoiler: '',
        user: '',
        text: '',
      };
    },
    computed: {
      formattedText: function() {
        return SnuOwnd.getParser().render(this.text);
      },
      prettyDate: function() {
        return moment(self.date).format('dddd, MMMM Do YYYY');
      },
    },
    methods: {
      savePost: function() {
        var self = this;

        var formData = new FormData();
        formData.append('title', self.title);
        formData.append('spoiler', self.spoiler);
        formData.append('user', self.user);
        formData.append('text', self.text);
        formData.append('date', self.date);

        fetch('/api/post', {
          method: 'POST',
          body: formData,
        })
          .then(response => response.json())
          .catch(error => console.error('Error:', error))
          .then(function(json) {
            router.push({ path: '/' });
          });
      },
    },
  });

  var editPost = Vue.component('edit-post', {
    template: '#post',
    props: ['id'],
    data() {
      return {
        title: '',
        spoiler: '',
        user: '',
        text: '',
        date: '',
      };
    },
    created: function() {
      var self = this;

      fetch('/api/post/' + self.id)
        .then(function(response) {
          return response.json();
        })
        .catch(error => console.error('Error:', error))
        .then(function(json) {
          self.title = json.title;
          self.spoiler = json.spoiler;
          self.user = json.user;
          self.text = json.text;
          var m = new moment(json.date);
          self.date = m.utc().format('YYYY-MM-DD');
        });
    },
    computed: {
      formattedText: function() {
        return SnuOwnd.getParser().render(this.text);
      },
      prettyDate: function() {
        return moment(self.date).format('dddd, MMMM Do YYYY');
      },
    },
    methods: {
      savePost: function() {
        var self = this;

        var formData = new FormData();
        formData.append('title', self.title);
        formData.append('spoiler', self.spoiler);
        formData.append('user', self.user);
        formData.append('text', self.text);
        formData.append('date', self.date);

        fetch('/api/post/' + self.id, {
          method: 'POST',
          body: formData,
        })
          .then(response => response.json())
          .catch(error => console.error('Error:', error))
          .then(function(json) {
            router.push({ path: '/' });
          });
      },
    },
  });

  const routes = [
    { path: '/', component: postList },
    { path: '/post/new', component: newPost, props: route => ({ date: route.query.d }) },
    { path: '/post/:id', component: editPost, props: route => ({ id: route.params.id }) },
  ];

  const router = new VueRouter({
    routes,
  });

  const app = new Vue({
    router,
  }).$mount('#app');

  /* Utility functions */

  // Format the date for our requirements as year-month-day
  function formatDate(date) {
    var d = 'Y-m-d'
      .replace('Y', date.getFullYear())
      .replace('m', date.getMonth() + 1)
      .replace('d', date.getDate());
    return d;
  }
}
