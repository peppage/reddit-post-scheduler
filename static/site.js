if (window.Vue) {
  Vue.use(VueRouter);

  var longDateFormat = 'dddd, MMMM Do YYYY';
  var pythonDateFormat = 'YYYY-MM-DD';

  var postList = Vue.component('calendar-list', {
    template: '#calendarList',
    data() {
      return {
        start: moment(),
        dates: [],
        days: 14,
      };
    },
    created: function() {
      this.loadData();
    },
    mounted: function() {},
    computed: {},
    updated: function() {},
    methods: {
      loadData: function() {
        var self = this;
        var start = moment(self.start); // Need to make a copy to edit
        for (var i = 0; i < self.days - 1; i++) {
          var m = start.add(i, 'days');
          self.dates.push({
            month: m.month(),
            day: m.date(),
            display: m.format(longDateFormat),
            query: m.format(pythonDateFormat),
            posts: [],
          });
        }

        var params = '?';
        params += 'start=' + self.start.format(pythonDateFormat);
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
                console.debug(
                  'postDate: ' + postDate.month() + ' ' + postDate.date() + ' date: ' + d.month + ' ' + d.day,
                );
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
        return moment(self.date).format(longDateFormat);
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
}
