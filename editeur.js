$(function() {
	var lorem = "Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet.";
	var éditeurs = $(".editeur-semantique");
	éditeurs.append('<span class="elem-paragraphe"><span class="elem-important"><span class="texte">hello </span><span class="curseur"></span><span class="texte">world' + lorem + '</span></span><span class="texte">, bonjour monde !</span></span>');
	curseurClignotant();
	raccourcisClavier();
	curseurGauche();
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

function curseurGauche() {
	var curseur = $(".curseur");
	var p = curseur.prev();
	var n = curseur.next();
	var c = p.text().charAt(p.text().length - 1);
	n.text(c + n.text());
	p.text(p.text().substring(0, p.text().length - 1));
}

function curseurHaut() {
}

function curseurDroite() {
	var curseur = $(".curseur");
	var p = curseur.prev();
	var n = curseur.next();
	var c = n.text().charAt(0);
	n.text(n.text().substring(1));
	p.text(p.text() + c);
}

function curseurBas() {
}

function raccourcisClavier() {
	var raccourcis = {
		37 : curseurGauche,
		38 : curseurHaut,
		39 : curseurDroite,
		40 : curseurBas,
	};
	$(document).keydown(function (e) {
		if (raccourcis[e.keyCode]) {
			raccourcis[e.keyCode]();
		}
	});
}
