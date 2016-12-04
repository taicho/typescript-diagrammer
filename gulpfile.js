var path = require('path');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var tslint = require('gulp-tslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
var plumber = require('gulp-plumber');
var babel = require('gulp-babel');
var del = require('del');
var isparta = require('isparta');
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");
var sourcemaps = require('gulp-sourcemaps');


// Initialize the babel transpiler so ES2015 files gets compiled
// when they're loaded
require('babel-register');

gulp.task("ts-test",function(){ 

  return gulp.src(["lib/**/*.ts","!node_modules","!typings"])   
        .pipe(tslint({formatter:'verbose'}))
        .pipe(tslint.report());
});

gulp.task("ts-build", ["ts-test"], function () {
    return tsProject.src()
        .pipe(tsProject())            
        .js.pipe(gulp.dest("./"));
});

gulp.task("ts-sourcemaps-build", ["ts-build"], function () {
    return gulp.src(["lib/**/*.js","!node_modules","!typings"])
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write("./"))            
        .pipe(gulp.dest("./lib"));
});

gulp.task('static', ['ts-sourcemaps-build'], function () {
  return gulp.src('**/*.js')
    .pipe(excludeGitignore());
    // .pipe(eslint())
    // .pipe(eslint.format())
    // .pipe(eslint.failAfterError());
});

gulp.task('nsp', function (cb) {
  nsp({package: path.resolve('package.json')}, cb);
});

gulp.task('pre-test', function () {
  return gulp.src('lib/**/*.js')
    .pipe(excludeGitignore())
    .pipe(istanbul({
      includeUntested: true,
      instrumenter: isparta.Instrumenter
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function (cb) {
  var mochaErr;

  gulp.src('test/**/*.js')
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec'}))
    .on('error', function (err) {
      mochaErr = err;
    })
    .pipe(istanbul.writeReports())
    .on('end', function () {
      cb(mochaErr);
    });
});

gulp.task('watch', function () {
  gulp.watch(['lib/**/*.js', 'test/**'], ['test']);
});

gulp.task('babel', ['clean'], function () {
  return gulp.src('lib/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
  return del('dist');
});

gulp.task('prepublish', ['nsp', 'babel']);
gulp.task('default', ['static', 'test']);
