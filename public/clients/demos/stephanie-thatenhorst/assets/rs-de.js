/* Room Studio, German UI for Stephanie Thatenhorst */
(function(){
var T={
steps:['Foto','Wünsche','Ergebnis'],
drop:'Laden Sie ein Foto Ihres Raums hoch',dropSub:'Oder einen Grundriss. JPG oder PNG vom Handy oder Computer.',choose:'Foto hochladen',samples:'Oder ein Beispiel ausprobieren',
change:'Anderes Foto hochladen',looking:'Wir sehen uns Ihren Raum an',
roomQ:'Welcher Raum ist das?',detected:r=>`Erkannt: ${r}. Ändern Sie es, falls es nicht passt.`,planOpt:'Grundriss (ganze Wohnung)',
styleQ:'Wählen Sie eine Stilrichtung',designsQ:b=>`Entwürfe von ${b}`,
wantQ:'Was wünschen Sie sich?',wantPh:'z. B. mehr Farbe, ein Samtsofa, die Bücherwand behalten, wärmeres Licht',
chips:['Grundriss beibehalten','Mehr Farbe','Hell und luftig','Mehr Stauraum','Vintage-Klassiker','Warmes Licht','Pflanzen','Eine gemütliche Leseecke'],
vibeQ:'Die Stimmung',mood:['Ruhig','Ausgewogen','Mutig'],palette:['Warm','Neutral','Kühl'],tier:['Basis','Durchdacht','Premium'],
moodL:'Stimmung',paletteL:'Palette',tierL:'Ausführung',
go:'Meinen Raum gestalten',needImg:'Bitte zuerst ein Foto hochladen',
left:n=>`Heute noch ${n} ${n===1?'kostenloser Versuch':'kostenlose Versuche'}`,time:'Dauert etwa 30 Sekunden',
working:room=>`${room} wird gestaltet`,workingSub:d=>`Stilrichtung: ${d}`,
status:['Ihr Raum wird gelesen','Wände, Fenster und Licht bleiben erhalten','Die Stilrichtung wird angewendet','Möbel werden maßstäblich platziert','Letztes Licht und Details'],
applying:d=>`${d} wird angewendet`,drag:'Zum Vergleichen ziehen',elapsed:'Vergangen',
keepOpen:'Bitte lassen Sie diese Seite geöffnet, während das Bild entsteht.',
before:'Vorher',after:'Nachher',
resultT:(room,st)=>room==='Grundriss (ganze Wohnung)'?`Ihre Wohnung im Stil ${st}`:`${room} im Stil ${st}`,
resultSub:'Ziehen Sie über das Bild, um Vorher und Nachher zu vergleichen.',youAsked:'Ihre Wünsche',
pass:b=>`An ${b} weitergeben`,again:'Andere Stilrichtung versuchen',download:'Bild speichern',
disclaimer:b=>`Ein Konzeptbild, um die Idee zu zeigen. Das echte Design erarbeitet ${b} gemeinsam mit Ihnen.`,
passTitle:b=>`An ${b} weitergeben`,passSub:b=>`${b} erhält Vorher, Nachher und Ihre Wünsche und meldet sich mit den Details für Ihren Raum.`,
name:'Ihr Name',phone:'Telefon',email:'E-Mail',msg:'Möchten Sie noch etwas ergänzen? (optional)',
sendWa:'Per WhatsApp senden',sendMail:'Per E-Mail senden',sendHook:'An das Studio senden',back:'Zurück zu meinem Entwurf',
needContact:'Bitte geben Sie Ihren Namen und eine Telefonnummer oder E-Mail-Adresse an, damit das Studio antworten kann.',
sentTitle:n=>`Vielen Dank${n?', '+n:''}`,sentBody:b=>`Ihr E-Mail-Programm hat sich mit Vorher, Nachher und Ihren Wünschen geöffnet. Senden Sie die Nachricht ab, dann meldet sich ${b} bei Ihnen.`,
another:'Weiteren Raum gestalten',limit:'Ihre kostenlosen Versuche für heute sind aufgebraucht. Senden Sie Ihr Foto und Ihre Wünsche, das Studio gestaltet den Raum mit Ihnen.',
limitBtn:b=>`Ihren Raum an ${b} senden`,
preview:'Vorschau: Beispielergebnis, kein echtes Rendering',err:'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.'
};
function go(){if(!window.RoomStudio)return setTimeout(go,60);document.querySelectorAll('[data-rs-de]').forEach(function(el){var c=JSON.parse(el.getAttribute('data-rs-de'));c.text=T;window.RoomStudio.mount(el,c);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
})();
