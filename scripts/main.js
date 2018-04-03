// Activate the current navigation link, indicate external links
var items = document.body.querySelectorAll("a");
for (var i=0; i < items.length; i++) {
    var item = items[i];
    var href = item.getAttribute('data-filepath') || item.getAttribute('href');
    if (!item.hasAttribute('no-ext')) {
        if (/http[s]?\:/.test(href)) {
            iconify(item, "external");
            item.target = "_blank";
            item.setAttribute('rel', 'noopener');
        } else if (/mailto\:/.test(href)) {
            iconify(item, "mail outline");
        }
    }
    if (document.location.pathname.indexOf(href) > -1) {
        item.classList.add("active");
        $(item).closest('.content').addClass('active').prev('.title').addClass('active');
        $("#acc").css({opacity: 1});
    }
}
// Some "meta" pages aren't in the navigation, so in that case, open the general
// section so some navigation is showing. Flag these articles with nav: nav in the 
// meta YML of the article.
if (document.body.hasAttribute('nav')) {
    $("nav div:nth-child(2)").addClass('active').prev('.title').addClass('active');
}
var items = document.body.querySelectorAll("table");
for (var i=0; i < items.length; i++) {
    var item = items[i];

    item.className = "ui compact table";
}
function iconify(item, iconName) {
    var icon = document.createElement("i");
    icon.className = "ui small "+iconName+" icon";
    icon.textContent = "";
    item.appendChild(document.createTextNode(" "));
    item.appendChild(icon);
}