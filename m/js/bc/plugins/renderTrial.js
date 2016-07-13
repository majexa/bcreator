window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Render', 'render'), function() {
    Ngn.sd.TrialRender();
  });
});
