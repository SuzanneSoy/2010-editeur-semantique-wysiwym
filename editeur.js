$(function() {
	var éditeurs = $(".editeur-semantique");
	éditeurs.append('<span class="text">hello </span><span class="curseur"></span><span class="text">world</span>');
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
	console.log("gauche");
	var curseur = $(".curseur");
	var p = curseur.prev();
	var n = curseur.next();
	var c = p.text().charAt(p.text().length - 1);
	n.text(c + n.text());
	p.text(p.text().substring(0, p.text().length - 1));
}

function curseurHaut() {
	console.log("haut");
}

function curseurDroite() {
	console.log("droite");
	var curseur = $(".curseur");
	var p = curseur.prev();
	var n = curseur.next();
	var c = n.text().charAt(0);
	n.text(n.text().substring(1));
	p.text(p.text() + c);
}

function curseurBas() {
	console.log("bas");
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
