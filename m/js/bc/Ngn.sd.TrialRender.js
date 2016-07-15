Ngn.sd.TrialRender = function() {
  if (Ngn.sd.isTrialUser) {
    Ngn.Request.Iface.loading(true);
    new Ngn.Request.JSON({
      url: '/json_trialDialog',
      onComplete: function(r) {
        Ngn.Request.Iface.loading(false);
        new Ngn.Dialog.Msg({
          width: 300,
          okText: 'Render',
          message: r.text,
          ok: r.cnt > 0,
          onOkClose: function(r) {
            Ngn.sd.Render();
          }
        });
      }
    }).send();
  } else {
    Ngn.sd.Render();
  }
};