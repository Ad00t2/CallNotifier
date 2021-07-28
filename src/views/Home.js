/* eslint-disable */

import React from "react";
import { useHistory } from "react-router-dom";

// nodejs library that concatenates classes
import classNames from "classnames";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";

// @material-ui/icons
import CloudUpload from "@material-ui/icons/CloudUpload";
import CloudDownload from "@material-ui/icons/CloudDownload";

// core components
import Header from "components/Header/Header.js";
import Footer from "components/Footer/Footer.js";
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";
import Badge from 'components/Badge/Badge.js';
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardBody from "components/Card/CardBody.js";
import Muted from "components/Typography/Muted.js";
import ClipLoader from "react-spinners/ClipLoader";

// styles
import pageStyles from "assets/jss/material-kit-react/views/landingPage.js";
import typeStyles from "assets/jss/material-kit-react/components/typographyStyle.js";

// assets
import { primaryColor, infoColor, successColor, roseColor, warningColor, dangerColor } from "assets/jss/material-kit-react.js";

// CallNotifier
import * as SIP from "../sip/SIP";

function LogEntry({ entry }) {
  const [cardAnimaton, setCardAnimation] = React.useState('cardHidden');
  setTimeout(() => { setCardAnimation(''); }, 100);
  const pageClasses = makeStyles(pageStyles)();
  const reqResIconClasses = makeStyles(theme => ({
    reqResIcon: {
      position: 'absolute',
      left: '91%',
      top: '16%'
    }
  }))();

  function isReq(entry) {
    return ('method' in entry.message);
  }

  return (
    <Card
      style={{ width: "32em" }}
      title={`Message: ${JSON.stringify(entry.message)}`}
    >
      <CardBody>
        { (isReq(entry)) ?
          <div id="requestInfo">
            <InputAdornment className={reqResIconClasses.reqResIcon}>
              <CloudUpload style={{ color: (entry.isSend ? roseColor : warningColor) }} />
            </InputAdornment>
            <h3 style={{ color: primaryColor, display: "inline" }}>Request&emsp;</h3>
            <h4 style={{ display: "inline" }}>
                { `${entry.message.headers.expires === 0 ? '(UN)' : ''}${entry.message.method} - #${entry.message.headers.cseq.seq}` }
            </h4>
            <p>
              {`${entry.message.uri}`}
            </p>
          </div>
          :
          <div id="responseInfo">
            <InputAdornment className={reqResIconClasses.reqResIcon}>
              <CloudDownload style={{ color: (entry.isSend ? roseColor : warningColor) }} />
            </InputAdornment>
            <h3 style={{ color: infoColor, display: "inline" }}>Response&emsp;</h3>
            <h4 style={{ color: (entry.message.status == 200 ? successColor : dangerColor), display: "inline" }}>
              { `${entry.message.status} - "${entry.message.reason}"` }
            </h4>
          </div>
        }
        <div id="commonInfo">
          <p>
            {`${entry.address.protocol.toUpperCase()} / ${entry.address.address}:${entry.address.port}`}
          </p>
          <Muted>
            <small>
              {new Date(entry.time).toString()}
            </small>
            <br />
            <small style={{ color: primaryColor }}>
              Hover for more info
            </small>
          </Muted>
        </div>
      </CardBody>
    </Card>
  );
}

function SipLog({ log }) {
  return (
    <div
      style={{
        margin: "5em auto",
        overflow: "auto",
        width: "70vw",
        maxHeight: "75vh"
      }}
    >
      {
        log.map((entry) => {
          return (<LogEntry key={entry.id} entry={entry} />);
        })
      }
    </div>
  );
}

export default function Home({ isRegistered }) {
  const [cardAnimaton, setCardAnimation] = React.useState('cardHidden');
  setTimeout(() => { setCardAnimation(''); }, 500);
  const pageClasses = makeStyles(pageStyles)();
  const history = useHistory();

  const [loading, setLoading] = React.useState(false);
  const [log, setLog] = React.useState(SIP.sipLog);

  function unRegister() {
    setLoading(true);
    SIP.unRegister(res => {
      setLoading(false);
      SIP.stop();
      history.push('/');
    });
  }

  return (
    <Card
      style={{
        width: "95vw",
        height: "95vh",
        transform: "translate(0%, -1.5%)"
      }}
    >
      <CardBody>
        <div id="topRow" style={{ display: "inline" }}>
          <Badge style={{ float: "left" }} color={isRegistered ? "success" : "danger"}>{isRegistered ? "" : "Not "}SIP Registered</Badge>
          <Button size="sm" style={{ float: "right" }} onClick={() => unRegister()} color="primary">Unregister</Button>
        <div id="loader"
          style={{
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <ClipLoader
            color={primaryColor}
            loading={loading}
            size="5em"
          />
        </div>
        </div>
        { (!loading) &&
          <SipLog log={log} />
        }
      </CardBody>
    </Card>
  );
}
