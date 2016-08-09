var util = require("../lib/util.js");
var cloudcmsUtil = require("cloudcms-server/util/util");

module.exports = function(app, callback) {

    app.use(apiHandler);

    callback();
};

var apiHandler = function(req, res, next) {

    if (req.url === "/api/get")
    {
        req.cache.read("myNodes", function(err, cachedNodes) {
            if (cachedNodes)
            {
                console.log("found cachedmyNodes in cache: " + JSON.stringify(cachedNodes));
                return res.status(200).json(cachedNodes);
            }

            var myNodes = [];
            req.branch(function(err, branch) {
                branch.trap(function(err) {
                    return res.status(500).json(err);
                }).queryNodes({"_type": "n:node"},{"limit": 10})
                .each(function() {
                    var newsNode = this;
                    cloudcmsUtil.enhanceNode(newsNode);
                    myNodes.push(newsNode);
                }).then(function() {
                    req.cache.write("myNodes", myNodes, 60 * 15 /* cache for 15 minutes */, function() {
                        return res.status(200).json(myNodes);
                    });
                });
            })
        })
    }
    else if (req.url.indexOf("/api/get/") > -1)
    {
        var id = req.url.substr(9)
        var myNodes = [];
        req.branch(function(err, branch) {
            branch.trap(function(err) {
                return res.status(500).json(err);
            }).queryNodes({"_doc": id})
            .each(function() {
                var node = this;
                cloudcmsUtil.enhanceNode(node);
                myNodes.push(node);
            }).then(function() {
                return res.status(200).json(myNodes[0]);
            });
        })
    }
    else if (req.url === "/touch")
    {
        req.branch(function(err, branch) {
            branch.trap(function(err) {
                return res.status(500).json(err);
            }).queryNodes({"_type": "custom:article0"},{"limit": -1})
            .each(function() {
                this.touch();
            }).then(function() {
                return res.status(200).json(this);
            });
        })
        
    }
    else if (req.url === "/update")
    {
        req.branch(function(err, branch) {
            branch.trap(function(err) {
                return res.status(500).json(err);
            }).queryNodes({"_type": "custom:article0"},{"limit": -1})
            .each(function() {
                this["now"] = new Date().getTime();
                this.update();
            }).then(function() {
                return res.status(200).json(this);
            });
        })
        
    }
    else
    {
        next();
    }
};
