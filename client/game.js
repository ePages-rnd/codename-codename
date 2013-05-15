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
    return 'x: ' + pos.x + ' y: ' + pos.y;
};
