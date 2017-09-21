window.addEvent('sdPanelComplete', function () {
  new Ngn.Btn(Ngn.sd.fbtn('Download', 'download'), function () {
    new Ngn.Request({
      url: '/download/' + Ngn.sd.bannerId,
      onComplete: function (bannerUrl) {
        window.location = bannerUrl;
      }
    }).send();
  });
});
