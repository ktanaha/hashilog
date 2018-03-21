'use strict';

const Alexa = require('alexa-sdk');

const states = {
    DISTANCE: '_DISTANCE',
    TIME: '_TIME',
    GOAL: '_GOAL'
};

process.env.TZ = "Asia/Tokyo";

// COMMON

const STOP_MSG = 'それでは目標は立てずに終了します。';

// MAIN
const START_LAUNCH_MSG = '今日のランニングの目標を立てます。まずは目標距離を教えてください。';
const START_HELP_MSG =  '目標の距離と時間を教えてください。';

// DISTANCE
const HELP_DISTANCE_MSG = '目標距離を整数、キロメートル単位で教えてください。';
const UNKNOWN_DISTANCE_MSG = 'すみません。もう一度今回の目標距離を整数、キロメートル単位で教えてください。';
const TOOBIG_DISTANCE_MSG = 'キロメートルはちょっと無理していないですか？もう少し短い距離にしましょう。目標距離を教えてください。';

// TIME
const HELP_TIME_MSG = '目標タイムを教えてください。';
const UNKNOWN_TIME_MSG = 'すみません。もう一度今回の目標タイムを時間で教えてください。';
const TOOLONG_TIME_MSG = 'ちょっと遅すぎる気がします。もう少し頑張ってみましょう。目標タイムを教えてください。';

// GOAL
const GOAL_PRAISE_MSG = 'それは凄い！頑張りましたね！その調子で継続していきましょう！';
const GOAL_COMFORT_MSG = 'それは残念です。でも腐ってはダメです。気を取り直して次は頑張りましょう！';
const NO_ACTION_MSG = 'それでは頑張って目標を達成しましよう。きっとできます！';

const distanceHandlers = Alexa.CreateStateHandler(states.DISTANCE, {
    'Unhandled': function () {
        this.emit(':ask', UNKNOWN_DISTANCE_MSG);
    },
    'DistanceIntent': function () {
        const distance = Number(this.event.request.intent.slots.Distance.value);

        if (!Number.isInteger(distance)) {
            this.emit(':ask', UNKNOWN_DISTANCE_MSG);
        } else if (distance > 43) {
            this.emit(':ask', distance + TOOBIG_DISTANCE_MSG);
        } else if (distance === '0') {
            this.emit(':ask', UNKNOWN_DISTANCE_MSG);
        } else {
            this.handler.state = states.TIME;
            this.attributes['distance'] = distance;
            this.emit(':ask', '目標距離は' + distance + 'キロメートルですね。次に目標タイムを教えてください。');
        }
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', HELP_DISTANCE_MSG, HELP_DISTANCE_MSG);
    },
    'AMAZON.CancelIntent': function ()  {
        this.attributes['distance'] = '';
        this.handler.state = '';
        delete this.attributes['distance'];
        delete this.attributes['STATE'];

        this.emit(':tell', STOP_MSG);
    },
    'AMAZON.StopIntent': function ()  {
        this.attributes['distance'] = '';
        this.handler.state = '';
        delete this.attributes['distance'];
        delete this.attributes['STATE'];

        this.emit(':tell', STOP_MSG);
    },
});

function parser(m, length) {
    if (m.length < length) {
        return '';
    } else if (!m[length - 1]) {
        return '';
    } else {
        return m[length - 1].slice(0, -1);
    }
}

const timeHandlers = Alexa.CreateStateHandler(states.TIME, {
    'Unhandled': function () {
        this.emit(':ask', UNKNOWN_TIME_MSG);
    },
    'DurationIntent': function () {
        const duration = this.event.request.intent.slots.Duration.value;
        if (!duration) {
            this.emit(':ask', UNKNOWN_TIME_MSG);
        }

        const mP = duration.match(/^P\d/);
        if (!mP) {
            
        } else if (mP.length > 0) {
            this.emit(':ask', UNKNOWN_TIME_MSG);
        }

        const mPT  = duration.match(/(^PT)(\d+H)?(\d+M)?(\d+S)?/);
        const hour = parser(mPT, 3);
        const minute = parser(mPT, 4);
        const second = parser(mPT, 5);
        
        if (Number(hour) >= 24 || Number(minute) >= 1440 || Number(second) >= 86400) {
            this.emit(':ask', TOOLONG_TIME_MSG);
        }
                
        const hourMsg = hour === '' ? '' : hour + '時間';
        const minuteMsg = minute === '' ? '' : minute + '分';
        const secondMsg = second === '' ? '' : second + '秒';
        
        this.attributes['duration'] = duration;
        this.handler.state = states.GOAL;

        this.emit(':tell', '目標距離は' + this.attributes['distance'] + 'キロメートルで目標タイムは' + hourMsg  + minuteMsg + secondMsg + 'ですね。がんばってください。');
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', HELP_TIME_MSG, HELP_TIME_MSG);
    },
    'AMAZON.CancelIntent': function ()  {
        this.attributes['distance'] = '';
        this.attributes['duration'] = '';
        this.handler.state = '';
        delete this.attributes['distance'];
        delete this.attributes['duration'];
        delete this.attributes['STATE'];

        this.emit(':tell', STOP_MSG);
    },
    'AMAZON.StopIntent': function ()  {
        this.attributes['distance'] = '';
        this.attributes['duration'] = '';
        this.handler.state = '';
        delete this.attributes['distance'];
        delete this.attributes['duration'];
        delete this.attributes['STATE'];

        this.emit(':tell', STOP_MSG);
    },
});

const goalHandlers = Alexa.CreateStateHandler(states.GOAL, {
    'Unhandled': function () {
        this.emit('StartSession');
    },
    'NoActionIntent': function () {
        this.emit(':tell', NO_ACTION_MSG);
    },
    'AMAZON.YesIntent': function () {
        this.attributes['distance'] = '';
        this.attributes['duration'] = '';
        this.handler.state = '';
        delete this.attributes['distance'];
        delete this.attributes['duration'];
        delete this.attributes['STATE'];
        
        this.emit(':tell', GOAL_PRAISE_MSG);
    },
    'AMAZON.NoIntent': function () {
        this.attributes['distance'] = '';
        this.attributes['duration'] = '';
        this.handler.state = '';
        delete this.attributes['distance'];
        delete this.attributes['duration'];
        delete this.attributes['STATE'];
        
        this.emit(':tell', GOAL_COMFORT_MSG);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', '終了します。');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', '終了します。');
    },
});

const startSessionHandlers = {
    'StartSession': function () {
        if(this.handler.state === states.GOAL) {
            const distance  = this.attributes['distance'];
            const duration  = this.attributes['duration'];

            const mPT  = duration.match(/(^PT)(\d+H)?(\d+M)?(\d+S)?/);
            const hour = parser(mPT, 3);
            const minute = parser(mPT, 4);
            const second = parser(mPT, 5);
            
            const hourMsg = hour === '' ? '' : hour + '時間';
            const minuteMsg = minute === '' ? '' : minute + '分';
            const secondMsg = second === '' ? '' : second + '秒';
            
            this.emit(':ask', '前回立てた目標があります、' + distance + 'キロメートル、' + hourMsg + minuteMsg + secondMsg + 'の目標は達成できましたか？');
        } else {
            this.handler.state = states.DISTANCE;
            this.emit(':ask', START_LAUNCH_MSG); 
        }
    },
};

const handlers = {
    'StartOverIntent': function () {
        this.emit('StartSession');
    },
    'StartIntent': function () {
        this.emit('StartSession');
    },
    'LaunchRequest': function () {
        this.emit('StartSession'); 
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', START_HELP_MSG, START_HELP_MSG);
    },
    'AMAZON.CancelIntent': function () {
        this.attributes['distance'] = '';
        this.attributes['duration'] = '';
        this.handler.state = '';
        delete this.attributes['distance'];
        delete this.attributes['duration'];
        delete this.attributes['STATE'];
    },
    'AMAZON.StopIntent': function () {
        this.attributes['distance'] = '';
        this.attributes['duration'] = '';
        this.handler.state = '';
        delete this.attributes['distance'];
        delete this.attributes['duration'];
        delete this.attributes['STATE'];;
    },
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.dynamoDBTableName = 'RunningRecordSkillTable';
    //alexa.appID = MY_APP_ID;
    alexa.registerHandlers(handlers, startSessionHandlers, distanceHandlers, timeHandlers, goalHandlers);
    alexa.execute();
};