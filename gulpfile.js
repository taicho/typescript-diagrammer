const gulp = require('gulp');
const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs');

function executeNpm(commandName) {
    return (cb) => {
        exec(`npm run ${commandName}`, (err, stdout, stderr) => {
            console.log(stdout);
            if(stderr) {
                console.log(stderr);
                // process.exit(1);
            }   
            cb();
        });
    };
}

gulp.task('tslint', () => {
    const tslint = require('gulp-tslint');
    return gulp.src('./src/**/*.ts')
        .pipe(tslint({
            formatter: 'verbose'
        }))
        .pipe(tslint.report({ emitError: false }));
});

gulp.task('clean', executeNpm('clean'));

// Basic build process for TS.
gulp.task('build-typescript', executeNpm('build-typescript'));
gulp.task('build', gulp.series('clean', 'tslint', 'build-typescript'));
gulp.task('watch', gulp.series('build', function (done) {
    gulp.watch('./src/**/*', gulp.series('build'));
    done();
}));
gulp.task('test', gulp.series('build', function (done) {
    const mocha = require('gulp-mocha');
    return gulp.src('test/**/*.ts')
        .pipe(mocha({
            reporter: 'spec',
            require: ['ts-node/register'],
            slow: 0,
        })).once('error', (error) => {
            done();
            process.exit(1);
        })
        .once('end', () => {
            done();
            process.exit();
        });
}));