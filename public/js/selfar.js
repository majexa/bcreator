$().ready(function(){
    $('form').submit(function(){
    	jQuery.ajax({
    		type: 'POST',
    		url: 'http://easylandingpagecreator.com/autoresponder/self',
    		data: {data: $(this).serialize()},
    		success: function(data) {
                console.log(data);
    		}
    	});
        return true;
    });

    if ($('form')[0]) {
        $($('form')[0]).validate({
            validClass: 'bgray',
            errorPlacement: function(error, element) {
                element.addClass('bred');
            }
        });
    }

    if ($('form')[1]) {
        $($('form')[1]).validate({
            validClass: 'bgray',
            errorPlacement: function(error, element) {
                element.addClass('bred');
            }
        });
    }

    if (location.href) {
        var g = null;
        if (g = /ref=(\d+)/gi.exec(location.href)) {
            $('<input>').attr({
                type:  'hidden',
                name:  'msuiteref',
                value: parseInt(g[1])
            }).prependTo('form');
        }
    }
});