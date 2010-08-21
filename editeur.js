$(function() {
	var éditeurs = $(".editeur-semantique");
	éditeurs.append('<span class="text">hello <span class="curseur"></span>world</span>');
	curseurClignotant();
});

function curseurClignotant() {
	var affiché = false;
	var clignote = function() {
		if (affiché) {
			$(".curseur").removeClass("affiché");
			var délai = 500;
		} else {
			$(".curseur").addClass("affiché");
			var délai = 800;
		}
		affiché = !affiché;
		window.setTimeout(clignote, délai);
	};
	clignote();
}
