window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Download', 'download'), function() {
    new Ngn.Dialog.Confirm({
      okText: 'Download',
      message: '<p>You have 9 renders left as part of your Trial account. Are you sure you want to render?</p><p><a href="/trialExpiration">Upgrade your account here</a></p>',
      onOkClose: function() {
        var dialog = new Ngn.Dialog.Loader({
          title: 'Rendering...',
          width: 200
        });
        new Ngn.Request({
          url: '/download/' + Ngn.sd.bannerId,
          onComplete: function(bannerUrl) {
            dialog.close();
            window.location = bannerUrl;
          }
        }).send();
      }
    });
  });
});
