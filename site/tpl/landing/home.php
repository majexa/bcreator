<div class="span-24 last man">
  <div class="frame">
    <div class="body">
      <div class="cont">
        <h2>More than a banner creator</h2>
        <p><b>Professional banner creation app for designers & marketers</b></p>
        <p>You can create static, animated GIF banner ads smart and easy.
          Start from scratch or grab template from our gallery. Add a background,
          animate your text and images, experiment with different colors and push our
          banner creator to the limits.</p>
      </div>
    </div>
    <div class="foot">
      <div class="cont">
        <div class="column" style="width:140px">
          <a href="<?= Auth::get('id') ? '/list/create' : '/register' ?>" class="btn">make a banner</a>
          <p>Download formats:</p>
          <p>
            <span class="format"><span>PNG</span></span>
            <span class="format"><span>GIF</span></span>
          </p>
        </div>
        <div class="span-4 last">
          You don't have to buy today, our banner maker is <a href="<?= Auth::get('id') ? '/list/create' : '/register' ?>">FREE</a> to try
        </div>
        <div class="clear"></div>
      </div>
    </div>
  </div>
</div>
<div class="span-24 last icons">
  <div class="easy">
    <i></i>
    <h2>Easy to use</h2>
    <p>Some text here</p>
  </div>
  <div class="template">
    <i></i>
    <h2>Beautiful Templates</h2>
    <p>Some very very large and long text here</p>
  </div>
  <div class="publish">
    <i></i>
    <h2>Publish it</h2>
  </div>
</div>
<div class="span-24 last title">
  <h2>Some examples:</h2>
</div>
<div class="span-24 last examples slider">
  <div class="body">
    <img src="/m/img/landing/left.png" class="left">
    <div id="examples">
      <? foreach ($d['banners'] as $v) { ?>
        <img style="width:<?= $v['w'] ?>px;" src="<?= $v['directLink'] ?>">
      <? } ?>
    </div>
    <img src="/m/img/landing/right.png" class="right">
    <div class="clear"></div>
  </div>
</div>
<script>
  new Ngn.Carousel(document.getElement('#examples'), {
    btnPrevious: document.getElement('.examples .left'),
    btnNext: document.getElement('.examples .right')
  });
</script>

<div class="span-24 last features">
  <div class="item">Free Unlimited Hosting</div>
  <div class="item">Ready Made Templates</div>
  <div class="item">Build Unlimited Banners</div>
</div>
<div class="span-24 last responses slider">
  <div class="bg"></div>
  <img src="/m/img/landing/left.png" class="left">
  <div id="responses">
    <div class="span-24 last item">
      <div class="cont">
        <p>
          <img src="/m/img/landing/responses/face1.png">
        </p>
        <p>
          Banner Creator is an all-in-one toolkit for your online advertising needs.
          The user interface is user-friendly, making it easy even for non-designers
          to create professional-level banner design.
        </p>
        <p><b>Mike Noodles</b></p>
      </div>
    </div>
    <div class="span-24 last item">
      <div class="cont">
        <p>
          <img src="/m/img/landing/responses/face2.png">
        </p>
        <p>
          Banner Creator is an all-in-one toolkit for your online advertising needs.
          The user interface is user-friendly, making it easy even for non-designers
          to create professional-level banner design.
        </p>
        <p><b>Kristina Noodles</b></p>
      </div>
    </div>
    <div class="clear"></div>
  </div>
  <img src="/m/img/landing/right.png" class="right">
</div>

<script>
  new Ngn.Carousel(document.getElement('#responses'), {
    btnPrevious: document.getElement('.responses .left'),
    btnNext: document.getElement('.responses .right')
  });
</script>
