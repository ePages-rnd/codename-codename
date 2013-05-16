Deps.autorun(function() {
    console.log(Session.get('currentposition'));
});

Template.game.events({
    'click #create-spot-btn': function () {
        console.log(Session.get('currentposition'));
    }
});

Template.game.currentposition = function () {
    var pos = Session.get('currentposition');
    return 'lat: ' + pos.lat + ' long: ' + pos.long;
};
