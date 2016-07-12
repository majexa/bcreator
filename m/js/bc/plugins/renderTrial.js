window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Render', 'render'), function() {
    if (Ngn.sd.isTrialUser) {
      new Ngn.Dialog.Confirm({
        okText: 'Render',
        message: '<p>You have 9 renders left as part of your Trial account. Are you sure you want to render?</p><p><a href="/trialExpiration">Upgrade your account here</a></p>',
        onOkClose: function() {
          Ngn.sd.Render();
        }
      })
    }
  });
});
