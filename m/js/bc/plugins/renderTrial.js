window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Render', 'render'), function() {
    if (Ngn.sd.isTrialUser) {
      new Ngn.Dialog.Confirm({
        okText: 'Render',
        message: 'U have 10 rendering times. If u want to anlarge <a href="/purchice">purchice your account</a>',
        onOkClose: function() {
          Ngn.sd.Render();
        }
      })
    }
  });
});
