<link rel="stylesheet" href="/public/css/my-bootstrap-form.css" type="text/css" />
<link rel="stylesheet" href="/public/css/select_landing_page.css" type="text/css" />
<!--
Start of DoubleClick Floodlight Tag: Please do not remove
Activity name of this tag: Landing page tracking pixel
URL of the webpage where the tag is expected to be placed: http://easylandingpagecreator.com
This tag must be placed between the <body> and </body> tags, as close as possible to the opening tag.
Creation Date: 01/12/2016
-->
<script type="text/javascript">
    var axel = Math.random() + "";
    var a = axel * 10000000000000;
    document.write('<iframe src="https://5326308.fls.doubleclick.net/activityi;src=5326308;type=invmedia;cat=mbxokgmh;dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;ord=' + a + '?" width="1" height="1" frameborder="0" style="display:none"></iframe>');
</script>
<noscript>
<iframe src="https://5326308.fls.doubleclick.net/activityi;src=5326308;type=invmedia;cat=mbxokgmh;dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;ord=1?" width="1" height="1" frameborder="0" style="display:none"></iframe>
</noscript>
<!-- End of DoubleClick Floodlight Tag: Please do not remove -->

<!-- Google Code for Remarketing Tag -->
<!--------------------------------------------------
Remarketing tags may not be associated with personally identifiable information or placed on pages related to sensitive categories. See more information and instructions on how to setup the tag on: http://google.com/ads/remarketingsetup
--------------------------------------------------->
<script type="text/javascript">
    /* <![CDATA[ */
    var google_conversion_id = 1001142914;
    var google_custom_params = window.google_tag_params;
    var google_remarketing_only = true;
    /* ]]> */
</script>
<script type="text/javascript" src="//www.googleadservices.com/pagead/conversion.js">
</script>
<noscript>
<div style="display:inline;">
    <img height="1" width="1" style="border-style:none;" alt="" src="//googleads.g.doubleclick.net/pagead/viewthroughconversion/1001142914/?value=0&amp;guid=ON&amp;script=0"/>
</div>
</noscript>

<div class="content full">
    <div class="block">
        <div class="signin">
            <fieldset>
                <?php if ($_SESSION['msg']) {
                    ?><h3 class="error-message"><?php echo $_SESSION['msg']; ?></h3><?php
                        unset($_SESSION['msg']);
                    }
                    ?>

                <form class="form-horizontal" id="f1" method="POST"action="" >
                    <fieldset>

                        <legend>Support</legend>
                        <div class="form-group">
                            <label class="col-md-4 control-label" for="firstName">First Name</label>  
                            <div class="col-md-4">
                                <input type="text" id="form-fname" name="firstName" class="required form-control input-md" placeholder="e.g. John" required="">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-md-4 control-label" for="lastName">Last Name</label>  
                            <div class="col-md-4">
                                <input type="text" id="form-lname" name="lastName" class="required form-control input-md" placeholder="e.g. Smith" required="">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-md-4 control-label" for="lastName">Email</label>  
                            <div class="col-md-4">
                                <input type="text" id="form-email" name="login" class="email required form-control input-md" placeholder="my@email.com" required="">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-md-4 control-label" for="lastName">Message</label>  
                            <div class="col-md-4">
                                <textarea type="password" id="form-message" name="message" class="message required form-control input-md" placeholder="*****" required=""></textarea>
                            </div>
                        </div>

                        <div class="bootstrap-button">
                            <input type="submit" class="btn btn-submit" value="SUBMIT">
                        </div>

                    </fieldset>
                </form>
            </fieldset>
        </div>
    </div>
</div>    
<script type="text/javascript">
<!--
    $().ready(function () {
        $('#form-email1').change(function (x, y) {
            $('#os0').val($('#form-email1').val());
        });

        $('.popup-youtube').magnificPopup({
            disableOn: 700,
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: false,
            fixedContentPos: false
        });

        $('form#f1').validate({
            validClass: 'bgray',
            errorPlacement: function (error, element) {
                element.addClass('bred');
            }
        });

        $('form#f2').validate({
            validClass: 'bgray',
            errorPlacement: function (error, element) {
                element.addClass('bred');
            },
            rules: {
                password: {
                    minlength: 6,
                }
            },
            messages: {
                password: {
                    minlength: jQuery.format('Password must have at last 6 chars')
                }
            }
        });

        $('#sugnup-button').click(function () {
            if ($("#f2").valid()) {
                $('#sugnup-button').addClass('button-progress');
                $.post("/index/registerSignup", $("#f2").serialize(), function (data) {
                    var obj = jQuery.parseJSON(data);
                    if ('ok' == obj.status.substr(0, 2)) {
                        if (Number(obj.status.substr(2)) > 0) {
                            $('#hosted_button_id').val(obj.hosted_button_id);
                            $('#f2').submit();
                        } else {
                            $("#dialog-message2").dialog({
                                modal: true,
                                width: 400,
                                buttons: {
                                    Ok: function () {
                                        $(this).dialog("close");
                                        location.href = '/signin/';
                                    }
                                }
                            });
                        }
                    } else {
                        alert(obj.status);
                        $('#sugnup-button').removeClass('button-progress');
                    }
                });
            } else {
                $('html, body').animate({scrollTop: $("#f2").offset().top}, 500);
            }
        });

        $('form#f3').validate({
            validClass: 'bgray',
            errorPlacement: function (error, element) {
                element.addClass('bred');
            }
        });

        $('#discountHelp').click(function () {
            $("#dialog-message").dialog({
                modal: true,
                width: 600,
                buttons: {
                    Ok: function () {
                        $(this).dialog("close");
                    }
                }
            });
        });
    });
-->
</script>
<link rel="stylesheet" href="http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css" />
<script src="http://code.jquery.com/ui/1.10.3/jquery-ui.js"></script>
<div id="dialog-message" title="Get your discount code from anyone of our Partners" style="display: none;">
<?php echo Sql::get("select contents from block where pageId = 7"); ?>
</div>
<div id="dialog-message2" title="Sign Up is complete" style="display: none;">
    <h2>Thank you for signing up with Easy Landing Page Creator</h2>
    <h3>You can now close this popup and login</h3>
</div>
