if (window.Vue) {
  Vue.use(VueRouter);

  var longDateFormat = 'dddd, MMMM Do YYYY';
  var pythonDateFormat = 'YYYY-MM-DD';

  var postList = Vue.component('calendar-list', {
    template: '#calendarList',
    data() {
      return {
        start: moment().add(1, 'days'),
        dates: [],
        days: 14,
      };
    },
    created: function() {
      this.loadData();
    },
    mounted: function() {},
    computed: {
      nextButton: function() {
        return 'Next ' + this.days + ' days';
      },
      previousButton: function() {
        return 'Prev ' + this.days + ' days';
      },
    },
    updated: function() {},
    methods: {
      loadData: function() {
        var self = this;
        var start = moment(self.start); // Need to make a copy to edit
        for (var i = 0; i < self.days; i++) {
          self.dates.push({
            month: start.month(),
            day: start.date(),
            display: start.format(longDateFormat),
            query: start.format(pythonDateFormat),
            posts: [],
          });
          start.add(1, 'days');
        }

        var params = '?';
        var tmpTime = self.start.clone();
        params += 'start=' + tmpTime.add(-1, 'days').format(pythonDateFormat);
        params += '&days=' + self.days;

        fetch('/api/posts' + params)
          .then(function(response) {
            return response.json();
          })
          .catch(error => console.error('Error:', error))
          .then(function(json) {
            for (var p of json) {
              var postDate = moment(p.date).utc();
              for (var d of self.dates) {
                if (d.month == postDate.month() && d.day == postDate.date()) {
                  d.posts.push(p);
                  break;
                }
              }
            }
          });
      },
      nextPage: function() {
        this.dates = [];
        this.start.add(this.days, 'days');
        this.loadData();
      },
      prevPage: function() {
        this.dates = [];
        this.start.subtract(this.days, 'days');
        this.loadData();
      },
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
        error: false,
      };
    },
    created: function() {
      this.title += moment(this.date).format('MMM Do -');
    },
    computed: {
      formattedText: function() {
        return SnuOwnd.getParser().render(this.text);
      },
      prettyDate: function() {
        return moment(this.date).format(longDateFormat);
      },
    },
    methods: {
      savePost: function() {
        var self = this;
        self.error = false;

        validatePost(self)
          .then(function() {
            generateFormData(self).then(formData => {
              fetch('/api/post', {
                method: 'POST',
                body: formData,
              })
                .then(response => response.json())
                .catch(error => console.error('Error:', error))
                .then(function(json) {
                  router.push({ path: '/' });
                });
            });
          })
          .catch(function() {
            self.error = true;
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
        error: false,
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
          self.date = m.utc().format(pythonDateFormat);
        });
    },
    computed: {
      formattedText: function() {
        return SnuOwnd.getParser().render(this.text);
      },
      prettyDate: function() {
        return moment(self.date).format(longDateFormat);
      },
    },
    methods: {
      savePost: function() {
        var self = this;
        self.error = false;

        validatePost(self)
          .then(function() {
            generateFormData(self).then(formData => {
              fetch('/api/post/' + self.id, {
                method: 'POST',
                body: formData,
              })
                .then(response => response.json())
                .catch(error => console.error('Error:', error))
                .then(function(json) {
                  router.push({ path: '/' });
                });
            });
          })
          .catch(function() {
            self.error = true;
          });
      },
    },
  });

  function validatePost(self) {
    return new Promise((resolve, reject) => {
      if (self.title === '' || self.spoiler === '' || self.user === '' || self.text === '' || self.date === '') {
        reject();
      }
      resolve();
    });
  }

  function generateFormData(self) {
    return new Promise((resolve, reject) => {
      var formData = new FormData();
      formData.append('title', self.title);
      formData.append('spoiler', self.spoiler);
      formData.append('user', self.user);
      formData.append('text', self.text);
      formData.append('date', self.date);
      resolve(formData);
    });
  }

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
}
