var MULTI_LIGNE = 0;
var MONO_LIGNE = 1;
var EN_LIGNE = 2;
var typesNoeud = {
	document:   { catégorie: MULTI_LIGNE, enfants: ['titre', 'paragraphe'] },
	titre:      { catégorie: MONO_LIGNE,  enfants: ['important', 'texte'] },
	paragraphe: { catégorie: MULTI_LIGNE, enfants: ['important', 'texte'] },
	important:  { catégorie: EN_LIGNE,    enfants: ['texte'] },
	lien:       { catégorie: EN_LIGNE,    enfants: ['texte'], 'propriétés': ['cible'] },
	texte:      { catégorie: EN_LIGNE,    enfants: [] },
	
	lien: {
		aperçu: function(n) {
			return aperçu_noeud(n)
				.children(".étiquette")
				.append('<img src="..." alt="">');
		},
		édition: function(n) {
			return édition_noeud(n).prepend('<input type="text" value="propriété <cible>"/>')
		},
		propriétés: {
			'interne': false,
			'cible': 'http://example.com/'
		}
	},
	texte: {
		aperçu: function(n) {
			return $("<span/>").bind_text(n.texte);
		},
		édition: function(n) {
			return $("<textarea/>").bind_val(n.texte);
		},
		propriétés: {
			texte: new valeur("")
		}
	}
};

function éditeurSémantique(textareaOrigine) {
	var textareaOrigine = $(textareaOrigine);
	var xml = $("<document/>").append(textareaOrigine.val()); // Est-ce portable ?.
	
	var modèle = xmlVersModèle(xml.get(0));
	console.log(modèle);
	m = modèle;
}

function xmlVersModèle(xml) {
	function recursion(xml, parent) {
		var tag = xml.tagName.toLowerCase(); // TODO : si tagName n'est pas toujours un "vrai" string, .toString() .
		var ret = {
			type: tag,
			texte: (tag == "texte") ? $(xml).text() : '',
			parent: parent,
			document: null, // TODO
			positionDansParent: function() {
				return this.parent.contenu.indexOf(this); // Mouais...
			},
			insérer: function(noeud, position) {
				this.contenu.splice(position, 0, noeud);
				this.contenu[position].parent = this;
				// TODO : modifier la vue
			},
			supprimerEnfant: function(position) {
				return this.contenu.splice(position, 1);
			},
			modifierType: function(nouveauType) {
				// TODO : vérifier si le parent peut bien contenir ce type
				this.type = nouveauType;
				// TODO : modifier la vue
			},
			modifierPropriété: function(propriété, valeur) {
				// TODO : vérifier si ce type peut avoir cette propriété
				this[propriété] = valeur;
				// TODO : modifier la vue
			},

			// Fonctions secondaires :

			supprimer: function() {
				return this.parent.supprimerEnfant(this.positionDansParent());
			},
			insérerAvant: function(noeud) { // insère noeud avant this (à l'extérieur)
				this.parent.insérer(noeud, this.positionDansParent());
			},
			insérerAprès: function(noeud) { // insère noeud après this (à l'extérieur)
				this.parent.insérer(noeud, this.positionDansParent() + 1);
			},
			insérerDébut: function(noeud) { // insère noeud au début de this (à l'intérieur)
				this.insérer(noeud, 0);
			},
			insérerFin: function(noeud) { // insère noeud à la fin de this (à l'intérieur)
				this.insérer(noeud, this.contenu.length);
			},
			emballer: function(noeud) { // insère noeud à la place de this, et met this dedans
				var pos = this.positionDansParent();
				var parent = this.parent;
				var n = parent.supprimerEnfant(pos);
				parent.insérer(noeud, pos);
				noeud.insérer(n, 0); // TODO ? noeud.setContenu(this);
			},
			remplacer: function () {
				var pos = this.positionDansParent();
				var parent = this.parent;
				parent.supprimerEnfant(pos);
				for (var i = 0; i < arguments.length; i++) {
					parent.insérer(arguments[i], pos++);
				}
			},
			déballer: function() { // Contraire de emballer : supprime this, mais garde le contenu.
				var c = [];
				for (var i = 0; i < this.contenu.length; i++) {
					c[i] = this.supprimerEnfant(i); // TODO : l'insertion devrait elle-même supprimer le noeud s'il est déjà inséré quelque part.
				}
				this.remplacer.apply(this, c);
			}
		};
		ret.contenu = $(xml).children().map(function (i,e) {
			return recursion(e, ret);
		}).get();
		return ret;
	}
	var ret = recursion(xml, null);
	/* ret.parent = ret; // Rhôôô le hack ! */
	return ret;
}

/* Modèle :

{ document, noeudActif, pressePapiers }

// Todo : où indiquer TypeVue (aperçu, édition, boutons(?), arbre) ?

vue.supprimerVue();
vue.supprimerEnfant(position);
noeud.créerVue(noeud, typeVue);
vue.insérerEnfant(noeud_enfant, position) { insérer_dans_vue_courante_à_position(créerVue(noeud_enfant), position); }
vue.setPropriété(propriété, valeur);
vue.setActif(bool);
document.noeudActif(noeud); // ?

=================

// ???
n = nouveauNoeud();
nparent.attacherÀPosition(n,3);
nparent.détacherPosition(3); // ?
n.détacher();                // ?

=================

// Contrôleur :
noeud.document.nouveauNoeud()

noeud.insérerAvant(n2)
noeud.insérerAprès(n2)
noeud.insérerDébut(n2)
noeud.insérerFin(n2)
noeud.insérerAutour(n2)

noeud.supprimer()
noeud.remplacer(n2, n3, ...) // remplacer n par n2, ... n(n+1)
noeud.supprimer_en_gardant_le_contenu() // TODO : trouver un nom meilleur. jquery : unwrap

m - noeud.modifierType(nouveaType); // TODO ! lien -> texte ou important ou ... doit préserver le texte du lien !

m - noeud.setPropriété(propriété, valeur);

*/

function valeur(v) { // TODO : voir si ça peut marcher aussi pour des éléments complets (pas que du texte).
	var valeur = v;
	var écouteurs = [];
	var f = function(v) {
		if (typeof v == "undefined") {
			return valeur;
		} else {
			var oldv = v;
			valeur = v;
			$(écouteurs).each(function(i,f){
				f(v, oldv);
			});
		}
	};
	f.ajouterÉcouteur = function(rappel) {
		écouteurs.push(rappel);
	}
	/* TODO : piquer le code de : http://github.com/jsmaniac/2010-ide-langage-grunt-flin607/blob/master/jside4/callbacks.js */
	return f;
}

function aperçu_noeud(n) {
	switch (noeud.type.catégorie) {
	case MULTI_LIGNE:
		var tag='div';
		var cat='multi-ligne';
		break;
	case MONO_LIGNE:
		var tag='div';
		var cat='mono-ligne';
		break;
	case EN_LIGNE:
		var tag='span';
		var cat='en-ligne';
		break;
	}
	
	var html = $('<' + tag + ' class="noeud"/>');
	html.addClass(n.type.classe).addClass(cat);
	$('<span class="étiquette"/>').text(n.type.étiquette).appendTo(html);
	$('<span class="contenu"/>').text(n.type.étiquette).appendTo(html);
	
	return html;
}

function unique_enfant_texte(n) {
	return (n.enfants().length == 1 && n.enfants(0).type == 'texte')
}

function édition_noeud_texte(n) {
	return $("<textarea/>");
}





$(function() {
	$(".éditeur-semantique").each(function(i,e) {
		éditeurSémantique(e);
	});
});

function éditeurSémantique_(textareaÉditeur) {
	var conteneur = $('<div class="conteneur-esem"/>');
	var éditeur = $(textareaÉditeur).removeClass("éditeur-semantique").addClass("éditeur");
	var boutons = $('<div class="boutons"/>');
	var aperçu = $('<div class="aperçu"/>');
	var elementActif = null;
	
	éditeur.replaceWith(conteneur);
	conteneur.append(aperçu);
	conteneur.append(boutons);
	conteneur.append(éditeur);
	
	var xml = $("<document/>").append(éditeur.text()); // Est-ce portable ?.
	éditeur.text("");
	
	function init() {
		xmlVersDom(xml, aperçu);
		sélectionElement(aperçu.children().first()); // assertion : type == Document
		bouton("important", function(debut, fin) {
			var t = elementActif.text();
			var t1 = créerElement("texte").text(t.substring(0,debut));
			var t2 = créerElement("texte").text(t.substring(debut,fin));
			var t2important = créerElement("important").append(t2);
			var t3 = créerElement("texte").text(t.substring(fin));
			elementActif.replaceWith(t1);
			t2important.insertAfter(t1);
			t3.insertAfter(t2important);
			sélectionElement(t2);
		});
	}
	
	function bouton(texte, fonction) {
		boutons.append($('<input type="button" class="bouton"/>').val(texte).click(function(e) {
			fonction(éditeur.get(0).selectionStart, éditeur.get(0).selectionEnd);
		}));
	}
	
	function xmlVersDom(xml,htmlParent) {
		var htmlElem = créerElement(xml.get(0).tagName.toLowerCase()).appendTo(htmlParent);
		
		if (xml.get(0).tagName.toLowerCase() == "texte") {
			htmlElem.append(xml.text());
		}
		
		xml.children().each(function(i,xmlElem) {
			xmlVersDom($(xmlElem),htmlElem);
		});
	}
	
	function créerElement(type) {
		var el = $('<span class="element"/>')
			.addClass(type)
			.data("type", type)
			.click(function(e) {
				sélectionElement(el);
				return false;
			});
		return el;
	}
	
	function sélectionElement(e) {
		elementActif = e;
		if (e.data("type") == "texte") {
			éditeurAttacher(e);
		} else {
			éditeurDétacher();
		}
	}
	
	function éditeurAttacher(elem) {
		éditeurDétacher();
		éditeur.val(elem.text());
		
		var éditeurValPrécédente = éditeur.val();
		function éditeurModif(e) {
			if (éditeur.val() != éditeurValPrécédente)
				elem.text(éditeur.val());
		}
		
		éditeur.bind("propertychange input cut paste keypress", éditeurModif);
	}
	
	function éditeurDétacher() {
		éditeur.unbind("propertychange input cut paste keypress");
		éditeur.val("");
	}
	
	init();
}
