// jQuery stuff
jQuery(document).ready(function($) {

	// Switch section
	$("a", '.mainmenu').click(function()
	{
        $('.navbar-toggle').click();
		return false;
	});
});